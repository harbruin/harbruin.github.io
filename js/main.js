$(function() {

    // Set up "report problem"

    $( '<div id="reportForm"/>' )
        .append( '<textarea id="reportMsg"/>' )
        .append( '<input id="reportName" type="text" placeholder="(Optional) Name"/>' )
        .append( '<input id="reportEmail" type="email" placeholder="(Optional) Email"/>' )
        .append( '<button id="reportClose">Cancel</button>' )
        .append( '<button id="reportBtn">Submit</button>' )
        .appendTo( '<div id="reportCover"/>' )
        .parent().appendTo( 'body' );
    $( '#report' ).click( function(e){
        e.preventDefault();
        $( '#reportCover' ).fadeIn();
        $( '#reportMsg' ).focus();
        $( 'body' ).css({
            'position': 'fixed',
            'z-index': '-1',
            'left': '50%',
            'margin-left': 'max(-50rem,-50%)',
            'top': '-'+window.scrollY+'px',
            'width': '100%'
        });
    });
    $( '#reportBtn, #reportClose' ).click( function(e){
        if ( this.id === 'reportBtn' ) {
            var msg = $( '#reportMsg' ).val();
            var info = 'Email: '+$('#reportEmail').val()+'\nName: '+$('#reportName').val();
            Analytics.send( {errorMsg: msg, errorObj: info, scriptUrl: window.location}, 'error' );
        }
        var scrollY = $('body').css('top');
        $( 'body' ).css({
            'position': '',
            'z-index': '',
            'left': '',
            'margin-left': '',
            'top': ''
        });
        window.scrollTo( 0, parseInt(scrollY||'0')*-1 );
        $( '#reportMsg, #reportName, #reportEmail' ).val('');
        $( '#reportCover' ).fadeOut();
    });


    // Set up main nav

    const query = location.search;
    if ( query === '?notrack' ) {
        $('nav a:not([href="#"])').attr('href',(i,href)=>href+query);
    }

    var toggle = document.querySelector( '.toggle' );
    var menu = document.querySelector( 'nav ul' );
    function toggleMenu( e ) {
        e.preventDefault();
        if ( menu.classList.contains( 'active' ) ) {
            menu.classList.remove( 'active' );
            toggle.querySelector( 'a' ).innerHTML = '<i class="fas fa-bars"></i>';
        } else {
            menu.classList.add( 'active' );
            toggle.querySelector( 'a' ).innerHTML = '<i class="fas fa-times"></i>';
        }
    }
    toggle.addEventListener( 'click', toggleMenu, false );


	// Create scroll-to links

	var t = $( '<a href="#main"/>' )
		.text( '^' )
		.attr( 'id', 'top' )
		/*.click(function( e ){
			e.preventDefault();
			var speed = Math.min( $(window).scrollTop()/4, 500 );
			$( 'html,body' ).animate( {scrollTop:0}, speed );
			return false;
		})*/
		.hide()
		.appendTo( 'body' );
	$( window ).scroll(function(){
		if ( $(this).scrollTop() > 120 ) {
			t.fadeIn();
		} else {
			t.fadeOut();
		}
	});

    function filterPath(string) {
      return string
        .replace(/^\//, '')
        .replace(/(index|default).[a-zA-Z]{3,4}$/, '')
        .replace(/\/$/, '');
    }

    var locationPath = filterPath( location.pathname );
    $('a[href*="#"]').each(function () {
      var thisPath = filterPath( this.pathname ) || locationPath;
      var hash = this.hash;
      if (hash && $("#" + hash.replace(/#/, '')).length) {
        if (locationPath == thisPath && (location.hostname == this.hostname || !this.hostname) && hash.replace(/#/, '')) {
          var $target = $(hash), target = this.hash;
          if (target) {
            $(this).click(function (event) {
              event.preventDefault();
              const htmlRem = parseInt($('html').css('font-size')),
                    targetTop = $target.offset().top;
              $('html, body').animate({scrollTop: targetTop - htmlRem*5 }, 1000, function () {
                location.hash = target; 
                $target.focus().blur();
                if ($target.is(":focus")){ //checking if the target was focused
                  return false;
                }else{
                  $target.attr('tabindex','-1'); //Adding tabindex for elements not focusable
                  $target.focus(); //Setting focus
                };
              });       
            });
          }
        }
      }
    });

});

function initDropdowns( elements, initialWidth ) {
	elements.each(function(){
		var $this = $( this ).attr( 'tabindex', '0' ),
			$list = $this.next( '.list' ),
			$wrap = $this.parent(),
			maxWidth = initialWidth,
			running = false;
		if ( initialWidth ) $( window ).resize(function(){
			var display = $list.css( 'display' );
			$wrap.css( { maxWidth: '100%', transition: 'none' } );
			$list.width( '' ).show().width( $list.width() ).css( 'display', display );
			$wrap.css( { maxWidth: maxWidth, transition: '' } );
		});
        if ( !$this.hasClass('category') ) {
            $this.on( 'click keydown', function(e){
                if ( running || ( e.type==='keydown' && ( e.keyCode!==32 || e.key!==' ' ) ) )
                    return;
                else
                    running = true;
                if ( e.type === 'click' ) $this.blur();
                var isOpen = $list.attr( 'data-opened' ) === 'true';
                if ( initialWidth )
                    $wrap.css( 'max-width', maxWidth = ( isOpen ? initialWidth : '100%' ) );
                $list.show().height( $list.prop( 'scrollHeight' ) + 'px' )
                    .delay( isOpen ? 10 : 301 )
                    .queue( function(n){$list.height('');n();} )
                    .delay( isOpen ? 301 : 0 )
                    .queue( function(n){
                        if ( isOpen ) $list.hide();
                        $list.attr( 'data-opened', !isOpen );
                        running = false;
                        n();
                    });
                $this.toggleClass( 'open closed' );
                e.preventDefault();
            })
            .toggleClass( 'closed ready' );
            $list.hide().attr( 'data-opened', false );
        }
        if ( !$wrap.hasClass('list_wrap') && !$list.find('a:not(.missing)').length )
            $this.addClass( 'disabled' );
		if ( initialWidth ) {
			$list.width( $list.width() );
			$wrap.css( 'max-width', initialWidth );
		}
	});
}
