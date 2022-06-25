(function(){
    const prog = document.createElement('section');
    prog.setAttribute('id','gc-progress');
    prog.innerHTML = `<style>
    #gc-progress {
        position: fixed;
        z-index: 1000;
        top: 50%; left: 50%;
        transform: translate( -50%, -50% );
        width: 90%;
        max-width: 800px;
        padding: 20px;
        background-color: #000b;
        text-align: center;
        --white: #fffa;
    }
    #gc-progress * {
        color: var(--white);
    }
    #gc-progress .gc-progress-bar {
        border: 1px solid var(--white);
        height: 2rem;
        background-image: linear-gradient( to right, var(--white), var(--white) );
        background-size: calc(var(--size) - 0.4rem * var(--percent)) 1.6rem;
        background-position: 0.2rem;
        background-repeat: no-repeat;
        transition: background 1s;
    }
    #gc-progress #gc-requested-prog {
        --size: 0%;
        --percent: 0;
    }
    #gc-progress #gc-received-prog {
        --size: 0%;
        --percent: 0;
    }
    </style>
    <h2 id="gc-requested">Requested: <span></span></h2>
    <div class="gc-progress-bar" id="gc-requested-prog"></div>
    <h2 id="gc-received">Received: <span></span></h2>
    <div class="gc-progress-bar" id="gc-received-prog"></div>
    `;
    document.body.append( prog );
    var x = 0, y = 0;
    Promise.all(
        Array.from(document.querySelectorAll('#content a'))
       .filter(a=>a.href.includes('/editions/'))
       .map((a,i,arr)=>{
            prog.querySelectorAll('span').forEach( span => span.textContent = '0 of '+arr.length );
            return new Promise(resolve=>setTimeout(function getData(){
                console.log('Fetching #'+(i+1)+': '+a.href.split('/').pop());
                document.querySelector('#gc-requested span').textContent = (++x)+' of '+arr.length;
                const percentComplete = Math.round(100*(x)/arr.length);
                const reqProg = document.querySelector('#gc-requested-prog');
                reqProg.style.setProperty('--size',percentComplete+'%');
                reqProg.style.setProperty('--percent',percentComplete/100);
                fetch(a.href).then(response=>response.text()).then(html=>{
                    const div = document.createElement('div');
                    div.innerHTML = html;
                    let set = div.querySelector('.section_title').innerText.trim();
                    set = set.includes(',')? '"'+set+'"' : set;
                    const rows = Array.from(div.querySelectorAll('.set_cards tr')).slice(1).map(row=>{
                        const num = row.querySelector('td').innerText.replace(/\D/g,'');
                        const name = '"'+row.querySelector('a').innerText.trim().replace('"','""')+'"';
                        return [1,name,num,set].join(',');
                    }).join('\n');
                    resolve( rows );
                    console.log('Resolved #'+(i+1)+': '+a.href.split('/').pop());
                    document.querySelector('#gc-received span').textContent = (++y)+' of '+arr.length;
                    const percentComplete = Math.round(100*(y)/arr.length);
                    const recProg = document.querySelector('#gc-received-prog');
                    recProg.style.setProperty('--size',percentComplete+'%');
                    recProg.style.setProperty('--percent',percentComplete/100);
                }).catch(()=>(--x,getData()));
            },200*i))
        })
    ).then(result=>{
        const csvData = new Blob( ['Count,Name,Card Number,Edition\n'+result.join('\n')], {type: 'text/csv;charset=utf-8;'} ),
              exportFilename = 'Full Deckbox Card List.csv';
        if ( navigator.msSaveBlob ) {
            navigator.msSaveBlob( csvData, exportFilename );
        } else {
            const reader = new FileReader();
            reader.onload = function() {
                const link = document.createElement('a');
                link.setAttribute('href', reader.result);
                link.setAttribute('download', exportFilename);
                document.body.appendChild(link);
                link.dispatchEvent( new MouseEvent('click') );
                document.body.removeChild( link );
            }
            reader.readAsDataURL(csvData);
        }
        prog.style.opacity = 0;
        prog.addEventListener('transitionend',()=>prog.remove());
    });
})()