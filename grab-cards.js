var x = 0, y = 0;
Promise.all(
    Array.from(document.querySelectorAll('#content a')).slice(1,100).map((a,i,arr)=>
        new Promise(resolve=>setTimeout(function getData(){
            console.log('Fetching '+(i+1)+' ('+(++x)+' of '+arr.length+')\n'+a.href.split('/').pop());
            fetch(a.href).then(response=>response.text()).then(html=>{
                const div = document.createElement('div');
                div.innerHTML = html;
                const set = '"'+div.querySelector('.section_title').innerText.trim()+'"';
                const rows = Array.from(div.querySelectorAll('.set_cards tr')).slice(1).map(row=>{
                    const num = row.querySelector('td').innerText.replace(/\D/g,'');
                    const name = '"'+row.querySelector('a').innerText.trim()+'"';
                    return [name,num,set].join(',');
                }).join('\n');
                resolve( rows );
                console.log('Resolved '+(i+1)+' ('+(++y)+' of '+arr.length+')');
            }).catch(()=>(--x,getData()));
        },100*i))
    )
).then(result=>{
    const csvData = new Blob( ['Name,Card Number,Edition\n'+result.join('\n')], {type: 'text/csv;charset=utf-8;'} ),
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
});