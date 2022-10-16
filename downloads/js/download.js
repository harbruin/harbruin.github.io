$( function() {

    /***************************
     * Build "database" tables *
     ***************************/

    const db = {
        categories: null,
        series: null,
        blocks: null,
        sets: null,
        decks: null,
        colors: null,
        misc: null
    };

    const series = {

        // Beginner
        starter: [
            {sort:'release',order:'asc'}
           ,{type:'info',flat:true,sort:'release'}
        ],
        welcome: [
            {sort:'color',order:'desc'}
           ,{sort:'release',order:'asc'}
           ,{type:'info set',sort:'none'}
        ],
        planeswalker: [
            {sort:'color',order:'desc'}
           ,{type:'set',flat:true,sort:'release',order:'asc'}
        ],
        intro: [
            {sort:'color',order:'desc'}
           ,{type:'set',flat:true,sort:'release',order:'desc'}
           ,{type:'block',sort:'release',order:'asc'}
        ],
        theme: [
            {sort:'color',order:'desc'}
           ,{type:'set',flat:true,sort:'release',order:'desc'}
           ,{type:'block',sort:'release',order:'asc'}
        ],
        clash: [
            {sort:'release',order:'asc'}
        ],
        toolkit: [
            {sort:'release',order:'asc'}
        ],

        // Competitive
        'challenger': [
            {sort:'color',order:'desc'}
           ,{type:'set',flat:true,sort:'release',order:'asc'}
        ],
        'event': [
            {sort:'color',order:'desc'}
           ,{sort:'release',order:'asc'}
           ,{type:'format',flat:true,sort:'name',order:'desc'}
        ],

        // Commander
        'set-commander': [
            {sort:'color',order:'desc'}
           ,{type:'set',flat:true,sort:'release',order:'asc'}
        ],
        'ub-commander': [
            {sort:'color',order:'desc'}
           ,{type:'set',flat:true,sort:'release',order:'asc'}
        ],
        'commander-anthology': [
            {sort:'color',order:'desc'}
           ,{type:'set',flat:true,sort:'release',order:'asc'}
        ],
        'annual-commander': [
            {sort:'color',order:'desc'}
           ,{type:'set',sort:'release',order:'asc'}
        ],

        // Other Series
        'jumpstart': [
            {type:'info',flat:true,sort:'none'}
           ,{type:'color',sort:'color',order:'desc'}
           //,{type:'set',sort:'release',order:'asc'}
        ],
        'archenemy': [
            {sort:'color',order:'desc'}
           ,{type:'set',flat:true,sort:'release',order:'asc'}
        ],
        'planechase': [
            {sort:'color',order:'desc'}
           ,{type:'set',flat:true,sort:'release',order:'asc'}
        ],
        'duel': [
            {sort:'release'}
        ],
        'premium': [
            {sort:'release'}
        ],
        'world-champ': [
            {sort:'release'}
        ],

        // Box Sets
        'game-night': [
            {sort:'color',order:'desc'}
           ,{type:'set',flat:true,sort:'release',order:'asc'}
        ],
        'explorers': [
            {sort:'color',order:'desc'}
        ],
        'deckmasters': [
            {sort:'color',order:'desc'}
        ],
        'beatdown': [
            {sort:'color',order:'desc'}
        ],
        'battle-royale': [
            {sort:'color',order:'desc'}
        ],
        'anthologies': [
            {sort:'color',order:'desc'}
        ],

        // Misc.
        'brawl': [
            {sort:'color',order:'desc'}
        ],
        'guild-kit': [
            {sort:'color',order:'desc'}
           ,{type:'set',flat:true,sort:'release',order:'asc'}
        ],
        'dotp': [
            {sort:'color',order:'desc'}
        ]
    };

    Promise.all( 
        Object.keys(db).map( tableName =>
            new Promise( resolve =>
                Papa.parse( '/db/'+tableName+'.csv', {
                    download: true,
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: 'greedy',
                    complete: resolve
                })
            ).then( result => 
                db[ tableName ] = result.data.reduce( (a,b) => {
                    if ( b.release ) b.release = new Date( b.release );
                    a[ b.id ] = b;
                    return a;
                }, { _rows: result.data } )
            )
        )
    ).then( init );



    /**************************
     * Dropdown Functionality *
     **************************/

    function init() {

        const $rootElement = $(document.createDocumentFragment());

        db.categories._rows.forEach( cat => {
            cat.element = createDropdown( cat, $rootElement, 2, {
                id: cat.id, 'class': 'list_wrap list_group'
            });
        });

        db.series._rows.forEach( ser => {
            const $parentElement = db.categories[ ser.category ].element;
            ser.groups = series[ser.id] || [];
            ser.groupElements = [];
            ser.children = [];
            ser.children.get = ()=> $( ser.children.map(a=>a.element.parent()) ).map( $.fn.toArray );
            ser.element = createDropdown( ser, $parentElement, 3, {'class': 'list_wrap'} )
               .append( appendData( ser, ['includes','note'] ) );
        });

        db.decks._rows.forEach( dec => {
          try {
            const classNames = ['missing','unverified']
                                .filter( cls => dec[cls] )
                                .concat( dec.cssClass || '' )
                                .join(' ').trim();
            const urlPath = '/csv/' + dec.series + '/' + dec.set + '_';
            const urlFilename = dec.name.replace(/[,.'()]/g,'')
                                .replace(/ /g,'+')
                                .replace('+-+','_');
            dec.url = dec.missing? null : urlPath + urlFilename + '.csv';
            const note = dec.note? '<div class="note">'+dec.note+'</div>' : null;
            const color = dec.color? 
                   '<div class="color">'
                  + dec.color.replace(/([A-Z])/g,'<i class="$1"></i>')
                  +'</div>'
              : null;
            const capSeries = dec.series.replace( /./, ch=>ch.toUpperCase() );
            dec.filename = dec.missing? null : capSeries+' - '+dec.set+' - '+dec.name+(note?' '+dec.note:'')+'.csv';

            dec.element = $( '<a/>' )
                .data( dec )
                .text( dec.name )
                .append( color, note )
                .addClass( classNames )
                .appendTo( '<li/>' );
            db.series[ dec.series ].children.push( dec );

          //dec.element.click( (e=>(dec.missing||fetch(dec.url).then(r=>r.text()).then(console.log),false)) );
          //if (dec.url) fetch( dec.url );
          } catch(e) {
            window.onerror(e);
            //console.log(dec,e);
          }
        });

        $( '#precon_lists' ).empty().append( $rootElement )
        updateSort();
        initDropdowns( $('#precon_lists').find('h2,h3,h4,h5') );
        initBatch();
    }

    function updateSort( ...seriesToChange ) {
        db.series._rows
        .filter( ser => !seriesToChange.length || seriesToChange.includes(ser.id) )
        .forEach( ser => {

            const getDBRow = ( type, dec ) => {
                switch( type ) {
                    case 'block':
                        return db.blocks[ db.sets[dec.set].block ];
                    case 'set':
                        return db.sets[ dec.set ];
                    case 'color':
                        return db.colors[ dec.color ];
                    case 'format':
                    case 'info':
                        return db.misc[ dec[type] ];
                    case 'deck':
                        return dec;
                }
            };

            ser.children.get().detach();
            ser.groupElements.forEach( e => e.element.remove() );
            ser.groupElements.length = 0;

            ser.groups.forEach( (group,i) => {
                const types = (group.type || '').split(' ').concat('deck');
                const sort = group.sort || 'name';
                const order = { asc:1, desc:-1 }[ group.order || 'asc' ];
                ser.children.sort( (a,b) => {
                    let compare = 0,
                        a_info, b_info;
                    types.forEach( type=> {
                        a_info ||= getDBRow( type, a );
                        b_info ||= getDBRow( type, b );
                    });
                    a_info = a_info[sort];
                    b_info = b_info[sort];
                    switch( sort ) {
                        case 'name':
                            if ( b_info > a_info ) compare = 1;
                            if ( b_info < a_info ) compare = -1;
                            break;
                        case 'color':
                            /*a_info = (db.colors[ a.color ] || {}).order || 99;
                            b_info = (db.colors[ b.color ] || {}).order || 99;*/
                            a_info = a.color? db.colors[ a.color ].order : 99;
                            b_info = b.color? db.colors[ b.color ].order : 99;
                        case 'release':
                            compare = b_info - a_info;
                            break;
                    }
                    return compare * order;
                });
            });

            const realElement = ser.element;
            ser.element = $( document.createDocumentFragment() );
            ser.children.forEach( dec => {
                let currentGroup = ser;
                for ( let len = ser.groups.length, i = len - 1; i >= 0; i-- ) {
                    const group = ser.groups[i];
                    if ( !group.type ) continue;
                    const types = group.type.split(' ');
                    let row;
                    while ( !row && types.length ) {
                        row = getDBRow( types.shift(), dec );
                    }
                    if ( !row ) continue;

                    let childGroup = currentGroup.groupElements.filter( e => e.id === row.id )[0];
                    if ( !childGroup ) {
                        const groupElement = createDropdown( row, currentGroup.element, 3+len-i );
                        if ( group.flat ) groupElement.prev().addClass( 'category' );
                        childGroup = {
                            id: row.id,
                            element: groupElement,
                            groupElements: []
                        };
                        currentGroup.groupElements.push( childGroup );
                    }
                    currentGroup = childGroup;
                }
                if ( dec.labeled )
                    dec.element.after('<span class="set">'+dec.set+'</span>');
                currentGroup.element.append( dec.element.parent() );
            });
            ser.element = realElement.append( ser.element );
        });
    }



    /*****************************
     * Setup batch functionality *
     *****************************/

    function initBatch() {
        const batchContents = [];
        let selectMultiple,
            userPreset,
            userCondition,
            userLanguage;
        function reset() {
            $( 'a[aria-selected]' ).removeAttr( 'aria-selected' );
            batchContents.length = 0;
            batchDialog.display( false ).empty();
            $('#top').css( 'visibility', '' );
        }
        function batch( link ) {
            const $link = $( link ),
                  isSelected = $link.attr( 'aria-selected' );
            if ( isSelected ) {
                const index = batchContents.indexOf( link );
                batchContents.splice( index, 1 );
                batchDialog.remove( $link.data('clone') );
                $link.removeData( 'clone' );
                $link.removeAttr( 'aria-selected' );
            } else if ( batchContents.length < 10 ) {
                const clone = $link.clone().off('click')[0];
                batchContents.push( link );
                batchDialog.add( clone );
                $link.data( 'clone', clone );
                $link.attr( 'aria-selected', true );
            }
            if (!!batchContents.length)
                $('#top').css( 'visibility', 'hidden' );
            else
                $('#top').css( 'visibility', '' );
            batchDialog.display( !!batchContents.length );
        }
        function downloadBatch() {
            Promise.all( batchContents.map( function(link,index) {
                const dec = $( link ).data();
                Analytics.reportDownload({
                    file: dec.name,
                    series: dec.series,
                    set: dec.set,
                    method: batchContents.length > 1 ? 'batch' : 'single',
                    language: userPreset? userLanguage : null,
                    condition: userPreset? userCondition : null
                });
                return fetch( dec.url )
                    .then( response=>response.text() )
                    .then( data=>{
                        const results = Papa.parse( data, {header: true} );
                        if ( userPreset ) results.data.forEach( card=>{
                            if ( card.Count && card.Name ) {
                                if ( userLanguage  ) card.Language  = userLanguage;
                                if ( userCondition ) card.Condition = userCondition;
                            }
                        });
                        if ( batchContents.length > 1 ) {
                            results.data.unshift( {Count:''} )//, {Count:'',Name:dec.name} );
                        } else {
                            results.data.name = dec.filename;
                        }
                        results.data.pop();
                        batchContents[index] = results.data;
                    });
            })).then(function(){
                const parsedBatch = Papa.unparse( batchContents.flat(), {
                    columns: [
                        'Count',
                        'Name',
                        'Foil',
                        'Card Number',
                        'Edition',
                        'Language',
                        'Condition'
                    ]
                }).split('\r\n').map((row,index)=>{
                    if ( row.replace(/,/g,'') === '' )
                        return row.replace(/,/g,'');
                    else
                        return row;
                }).join('\r\n');
                downloadCSV( parsedBatch, batchContents[0].name );
                reset();
            });
        }

        /* Dynamically create file for download */
        function downloadCSV( csv, name ) {
            const csvData = new Blob( ['\ufeff'+csv], {type: 'text/csv;charset=utf-8;'} ),
                  exportFilename = name || 'MTGprecon.csv';

            if ( navigator.msSaveBlob ) {
                navigator.msSaveBlob( csvData, exportFilename );
            } else {
                /*const link = document.createElement( 'a' ),
                      csvURL = URL.createObjectURL( csvData );
                link.setAttribute('href', csvURL);
                link.setAttribute( 'download', exportFilename );
                document.body.appendChild( link );
                link.dispatchEvent( new MouseEvent('click') );
                document.body.removeChild( link );
                setTimeout( URL.revokeObjectURL.bind(URL,csvURL) );*/
                var reader = new FileReader();
                reader.onload = function() {
                    var link = document.createElement('a');
                    link.setAttribute('href', reader.result);
                    link.setAttribute('download', exportFilename);
                    document.body.appendChild(link);
                    link.dispatchEvent( new MouseEvent('click') );
                    document.body.removeChild( link );
                }
                reader.readAsDataURL(csvData);
            }
        }
        function changeOptions() {
            selectMultiple = $( '#selectMultiple' ).prop( 'checked' );
            userPreset = $( '#userPreset' ).prop( 'checked' );
            userCondition = $( '#userCondition' ).val();
            userLanguage = $( '#userLanguage' ).val();

            localStorage.setItem( 'userPrefs', JSON.stringify({
                multiple: selectMultiple,
                preset: userPreset,
                condition: userCondition,
                language: userLanguage
            }));

            if ( this.id === 'selectMultiple' ) reset();
            if ( !userPreset ) {
                $( '#downloadOptions select' )
                    .iconselectmenu( 'disable' )
                    .parent().css( 'opacity', 0.3 );
            } else {
                $( '#downloadOptions select' )
                    .iconselectmenu( 'enable' )
                    .parent().css( 'opacity', '' );
            }
        };
        changeOptions();
        $( '#selectMultiple, #userPreset, #userCondition, #userLanguage' )
            .on( 'change iconselectmenuchange', changeOptions );
        $( '#precon_lists a:not(.missing)' ).click( function(e){
            if ( selectMultiple ) {
                batch( this );
            } else {
                batchContents.push( this );
                downloadBatch();
            }
        });


        // Capture download URLs

        if ( location.search ) {
            const links = $( '#precon_lists a:not(.missing)' ).get();
            const dl = location.search.slice(1)
                        .split('&')
                        .filter(p=>p.split('=')[0]==='dl');
            dl.map( dl=>dl.split('=').pop() )
              .forEach( url => {
                const link = links.filter( a=>
                    $(a).data().url.toLowerCase().includes( url.toLowerCase() )
                );
                batchContents.push( ...link );
            });
            if ( batchContents.length ) {
                downloadBatch();
                if ( window.history && history.replaceState )
                    history.replaceState( null, null, location.href.split('?')[0] );
            }
        }

        const batchDialog = (new FloatingDialog({
            wrapperClass: 'precons',
            listClass: 'list',
            button: (()=>{
                return $( '<a/>' )
                    .addClass( 'btn-primary fd-button' )
                    .prop('tabindex','0')
                    .click( downloadBatch )
                    .text( 'Download All' )[0];
            })(),
            itemRemoved: function(e) {
                const link = batchContents.filter( link =>
                    $( link ).data( 'clone' ) === e.detail
                )[0];
                batch( link );
            }
        })).create().display( false );
    }



    /*************************
     * DOM builder functions *
     *************************/

    const createDropdown = ( child, parent, level, prop = {} ) => {
        const $wrapElement = $( '<div/>' )
            .prop( prop )
            .appendTo( parent );
        $( '<h'+level+'/>' ).html( child.name )
            .prepend( child.discontinued? '<i class="fa fa-ban warning">' : '' )
            .appendTo( $wrapElement );
        return $( '<div class="list" />' ).appendTo( $wrapElement );
    };

    const appendData = ( dbRow, dataTypes ) =>
        dataTypes
        .filter( type => dbRow[type] )
        .map( type => $('<p/>').addClass(type).html(dbRow[type]) )
    ;



    /************************
     * Set up user controls *
     ************************/

    const userPrefs = localStorage.getItem('userPrefs');
    if ( userPrefs ) {
        ({multiple,preset,condition,language} = JSON.parse( userPrefs ));
        $( '#selectMultiple' ).prop( 'checked', multiple );
        $( '#userPreset' ).prop( 'checked', preset );
        $( '#userCondition' ).val( condition );
        $( '#userLanguage' ).val( language );
    }

    // Setup checkboxes for Download Multiple and User Preset

    $( '#downloadOptions input' ).checkboxradio();
    $( '.ui-checkboxradio-label' ).on( 'click keydown', function(e){
        const $this = $(this),
              clickable = !( $this.data('keyboard-activated') && !$this.data('clicked-once') );
        switch ( e.type ) {
            case 'click':
                if ( clickable ) {
                    $this.removeData()
                         .removeClass( 'ui-visual-focus' );
                } else {
                    $this.removeData().data( 'clicked-once', true );
                }
                break;
            case 'keydown':
                $this.removeData()
                     .data( 'keyboard-activated', true )
                     .addClass( 'ui-visual-focus' );
                break;
        }
    });

    // Setup dropdowns for Condition and Language preferences

    $.widget( "custom.iconselectmenu", $.ui.selectmenu, {
        _renderItem: function( ul, item ) {
            const li = $( "<li>" ),
                  wrapper = $( "<div>", { html: item.label || '&nbsp;' } );

            $( "<span>", {
              "class": item.element.attr( "data-class" ),
              title: item.element.text()
            })
              .appendTo( wrapper );
     
            return li.append( wrapper ).appendTo( ul );
        }
    });
    $( '#userCondition, #userLanguage' ).iconselectmenu({
        position: {
            collision: 'flip'
        },
        change: e=>{
            const id = $( e.target ).attr( 'id' ),
                  btn = $( `#${id}-button` ),
                  img = $( `#${id}-menu` ).find( '.ui-state-active span' );
            btn.find( '.sprite, .flag' ).remove();
            btn.append( img.clone() );
        },
        create: function(e){
            $(this).iconselectmenu( 'open' )
                   .iconselectmenu( 'close' )
                   .iconselectmenu( 'instance' )
                       .options.change({target:this});
        }
    });
    $( '#userLanguage' ).iconselectmenu( 'menuWidget' ).height( '11.2rem' );

});
