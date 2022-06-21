const FloatingDialog = function( options ) {

    const defaults = Object.assign({
        namespace: 'fd',
        container: document.body,
        wrapperClass: '',
        listClass: '',
        itemRemoved() {}
    }, options );

    let listHeight = '0px';
    const positioner = document.createElement( 'div' ),
          wrapper = document.createElement( 'div' ),
          list = document.createElement( 'ul' ),
          toggle = document.createElement( 'span' ),
          ns = defaults.namespace;

    this.create = function() {
        const wrapClass = [ `${ns}-wrapper` ].concat( defaults.wrapperClass.split(' ') ).filter(Boolean);
        const listClass = [ `${ns}-list` ].concat( defaults.listClass.split(' ') ).filter(Boolean);
        const button = defaults.button || _generateButton.call(this);
        const style = document.createElement( 'style' );
        positioner.classList.add( `${ns}-positioner` );
        wrapper.classList.add( ...wrapClass );
        wrapper.addEventListener( 'itemRemoved', defaults.itemRemoved );
        list.classList.add( ...listClass );
        list.setAttribute( 'aria-expanded', 'false' );
        list.style.height = listHeight;
        toggle.classList.add( `${ns}-toggle` );
        toggle.tabIndex = '0';
        toggle.addEventListener( 'click', this.toggleList.bind(this) );
        toggle.addEventListener( 'keydown', this.toggleList.bind(this) );
        style.innerText = css;
        style.querySelectorAll('br').forEach(br=>br.remove());

        document.querySelector('head').prepend( style );
        list.append( toggle );
        wrapper.append( list, button );
        positioner.append( wrapper );
        defaults.container.append( positioner );

        delete this.create;
        return this;
    };
    this.display = function( showDialog ) {
        if ( showDialog ) {
            wrapper.style.opacity = 1;
            wrapper.style.marginTop = '';
        } else {
            wrapper.style.opacity = 0;
            wrapper.style.marginTop = '10em';
            this.closeList();
        }
        return this;
    };
    this.toggleList = function( event ) {
        if ( event.type === 'click' || event.key === ' ' || event.key === 'Enter') {
            const isOpen = list.getAttribute( 'aria-expanded' ) === 'true';
            if ( isOpen ) {
                this.closeList();
            } else {
                this.openList();
            }
            if ( event.type === 'click' ) event.target.blur();
            event.preventDefault();
        }
        return this;
    };
    this.openList = function() {
        list.setAttribute( 'aria-expanded', 'true' );
        list.style.height = `${listHeight}px`;
        list.querySelectorAll( 'li' ).forEach(li=>li.style.opacity=1);
        return this;
    };
    this.closeList = function() {
        list.setAttribute( 'aria-expanded', 'false' );
        list.style.height = '0px';
        list.querySelectorAll( 'li' ).forEach(li=>li.style.opacity=0);
        return this;
    };
    this.empty = function() {
        this.closeList();
        setTimeout( ()=>{
            list.querySelectorAll( 'li' ).forEach(li=>li.remove());
        }, 200 );
        return this;
    };
    this.add = function( ...items ) {   
        list.append(
            ...items.map(item=>{
                const that = this,
                      event = new CustomEvent( 'itemRemoved', {detail:item} ),
                      li = document.createElement( 'li' ),
                      a = document.createElement( 'a' );
                a.classList.add( `${ns}-remove-item` );
                a.setAttribute( 'tabindex', '0' );
                a.href = '#';
                a.addEventListener( 'click', e=>{
                    that.remove.bind(that,item);
                    wrapper.dispatchEvent( event );
                    e.preventDefault();
                });
                li.style.opacity = '0';
                li.append( item, a );
                return li;
            })
        );
        _repaint();
        return this;
    };
    this.remove = function( ...items ) {
        const _this = this;
        items.forEach(item=>{
            const li = item.parentNode;
            li.style.height = `${li.offsetHeight}px`;
            li.style.opacity = 0;
            li.addEventListener( 'transitionstart', function(){
                li.style.height = '0px';
                li.style.padding = '0px';
                li.style.margin = '0px';
                li.addEventListener( 'transitionend', function(){
                    li.remove();
                    _repaint();
                }, {once:true});
            }, {once:true});
        });
        return this;
    };

    function _repaint() {
        const clone = wrapper.cloneNode( true ),
              cloneList = clone.querySelector( `.${ns}-list` ),
              isOpen = list.getAttribute( 'aria-expanded' ) === 'true';
        cloneList.style.cssText = 'height:auto;transition:none;';
        positioner.append( clone );
        listHeight = cloneList.scrollHeight;
        clone.remove();
        if ( isOpen ) {
            list.style.height = `${listHeight}px`;
            list.querySelectorAll( 'li' )
                .forEach( li=>li.style.opacity=1 );
        }
        return this;
    }
    function _generateButton() {
        const a = document.createElement( 'a' );
        a.classList.add( `${ns}-button` );
        a.innerText = 'Close';
        a.addEventListener( 'click', ()=>this.display( false ) );
        return a;
    }
    const css = `
.${ns}-positioner {
    position: absolute;
    z-index: 100;
    right: min( calc(100% + 1px), 40em );
    top: calc(100vh - 4.9em);
    font-size: 10px;
   -webkit-touch-callout: none;
     -webkit-user-select: none;
      -khtml-user-select: none;
        -moz-user-select: none;
         -ms-user-select: none;
             user-select: none;
}
.${ns}-positioner * {
    box-sizing: border-box;
}
.${ns}-wrapper {
    position: fixed;
    background-color: white;
    border: 1px solid black;
    max-width: 38em;
    width: calc(100% + 2px);
    height: 5em;
    box-shadow: -4px -4px 10px rgba(0,0,0,0.5);
    transition: opacity 0.3s, margin 0.3s;
}
.${ns}-wrapper * {
    position: relative;
    z-index: 2;
}
.${ns}-wrapper .${ns}-list {
    background-color: white;
    border: 1px solid black;
    border-bottom: 0;
    box-shadow: -4px -8px 10px rgba(0,0,0,0.5);
    width: calc(100% + 2px);
    height: 0px;
    margin: 0;
    padding: 1em 0 0;
    list-style: none;
    position: absolute;
    bottom: 4.8em;
    left: -1px;
    z-index: 1;
    overflow: visible;
    transition: height 0.3s;
}
.${ns}-wrapper .${ns}-list li {
    font-size: 1.6em;
    padding: 0.3125em;
    margin: 0 0.3125em 0.625em;
    outline: 1px solid gray;
    transition: opacity 0.2s, height 0.2s, padding 0.2s, margin 0.2s;
}
.${ns}-wrapper .${ns}-remove-item {
    cursor: pointer;
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    text-align: center;
    padding: 0.3125em;
    display: flex;
    align-items: center;
    justify-content: center;
}
.${ns}-wrapper .${ns}-remove-item::after {
    content: "\\00D7";
    font-weight: bold;
    background-color: black;
    border: 1px solid black;
    color: white;
    height: 1em;
    width: 1em;
    display: flex;
    justify-content: center;
    align-items: center;
}
.${ns}-wrapper .${ns}-remove-item:hover::after {
    background-color: white;
    color: black;
}
.${ns}-wrapper .${ns}-toggle {
    position: absolute;
    top: -2.4em;
    left: 50%;
    margin-left: -5em;
    display: inline-block;
    width: 10em;
    height: 2.4em;
    background-color: black;
    clip-path: polygon(
        25% 0%,
        75% 0%,
        100% 105%,
        0% 105%
    );
    text-align: center;
    cursor: pointer;
}
.${ns}-wrapper .${ns}-toggle:focus {
    outline: 0;
}
.${ns}-wrapper .${ns}-toggle::before {
    content: "";
    display: block;
    width: 9.8em;
    height: 2.3em;
    position: absolute;
    top: 0.1em;
    left: 0.1em;
    background-color: white;
    clip-path: polygon(
        25% 0%,
        75% 0%,
        100% 105%,
        0% 105%
    );
}
.${ns}-wrapper .${ns}-toggle:focus::before {
    background-color: orange;
}
.${ns}-wrapper .${ns}-toggle::after {
    content: "^";
    font-size: 1.6em;
    line-height: 1.3em;
    font-weight: bold;
    position: absolute;
    top: 0.3125em;
    left: 50%;
    margin-left: -0.5em;
    width: 1em;
    height: 1em;
    border: 1px solid black;
    border-radius: 0.5em;
    background-color: black;
    color: white;
    transition: transform 0.3s;
}
.${ns}-wrapper .${ns}-toggle:hover::after {
    background-color: white;
    color: black;
}
.${ns}-wrapper [aria-expanded=true] .${ns}-toggle::after {
    transform: rotate(180deg);
}
.${ns}-wrapper .${ns}-button {
    display: block;
    width: 80%;
    margin: 0 auto 0.33em;
    padding: calc(0.5em / 3);
    font-size: 3em;
    line-height: 1em;
    text-align: center;
    cursor: pointer;
    background-color: black;
    border: 1px solid black;
    color: white;
}
.${ns}-wrapper .${ns}-button:hover, .${ns}-wrapper .${ns}-button:focus {
    background-color: white;
    color: black;
}
    `;
};
