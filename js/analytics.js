const Analytics = (function() {
    const startTime = new Date();
    const lastVisit = localStorage['lastVisit'] ||= startTime;
    const inSameSession = document.cookie.indexOf( 'inSameSession' ) > -1;
    const isNewSession = !inSameSession || startTime - new Date(lastVisit) > 30*60*1000;
    localStorage['visitCount'] ||= 0;
    localStorage['dlCount'] ||= 0;
    if ( isNewSession ) {
        document.cookie = 'inSameSession=; path=/';
        localStorage['lastVisit'] = startTime;
        localStorage['visitCount']++;
    }

    const userData = (function(){
        const timeData = timeString( startTime );
        const browserData = bowser.parse( navigator.userAgent );
        return {
            sessionCount: localStorage['visitCount'],
            pageName: document.title.split(' | ')[0],
            visitID: `${timeData.date}.${timeData.time}`.replace( /[ :-]/g, '' ),
            visitDate: timeData.date,
            visitTime: timeData.time,
            referrer: document.referrer,
            referringDomain: document.referrer.split('/')[2] || 'SMS, Email, Direct',
            language: navigator.language,
            browser: [ browserData.browser.name, browserData.browser.version ].join(' '),
            os: [ browserData.os.name, browserData.os.versionName ].join(' '),
            deviceType: browserData.platform.type,
            deviceWidth: window.screen.width,
            deviceHeight: window.screen.height
        };
    })();
    const googleForm = {
        visit: {
            action: 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSc2QrZbLJdZ-lui3cd_fvnRGI0KgAlWktJfdfSUmYlw6KOGJA/formResponse',
            fields: {
                userID: 'entry.962546997',
                sessionCount: 'entry.1793514098',
                pageName: 'entry.883882810',
                visitID: 'entry.1713491177',
                visitDate: 'entry.1650013652',
                visitTime: 'entry.1960774424',
                visitTimeEnd: 'entry.934100935',
                visitDuration: 'entry.2019867567',
                visitDownloads: 'entry.1695817512',
                lifetimeDownloads: 'entry.2025548144',
                kofi: 'entry.2099746517',
                ip: 'entry.2073350539',
                location: 'entry.1751104765',
                language: 'entry.613494401',
                browser: 'entry.1169034180',
                os: 'entry.1939780434',
                deviceType: 'entry.2020971479',
                deviceWidth: 'entry.687679343',
                deviceHeight: 'entry.1788660642',
                isp: 'entry.2080485216',
                referrer: 'entry.2142072432',
                referringDomain: 'entry.382617932'
            }
        },
        download: {
            action: 'https://docs.google.com/forms/d/e/1FAIpQLScJCS_R5gp1UhmvvMySkSTmw37RWjRr1CjCFtSNxt3fIo9y-g/formResponse',
            fields: {
                userID: 'entry.754874388',
                visitID: 'entry.325005182',
                file: 'entry.1205941499',
                series: 'entry.1747237733',
                set: 'entry.1750182000',
                method: 'entry.290552760',
                language: 'entry.193192489',
                condition: 'entry.1466168198'
            }
        },
        error: {
            action: 'https://docs.google.com/forms/d/e/1FAIpQLSfD4RDWK_33gYF6JYTtsrmPIUgLNrSe6xaSJM68zkGqy8KbmA/formResponse',
            fields: {
                userID: 'entry.1911857403',
                visitID: 'entry.42676102',
                pageName: 'entry.1610333278',
                errorMsg: 'entry.1300018196',
                scriptUrl: 'entry.316638381',
                lineNum: 'entry.1463139423',
                errorObj: 'entry.1417233630'
            }
        }
    };

    let userID = localStorage['userID'],
        visitDownloads = 0,
        kofi = false;

    fetch( 'https://ipinfo.io/json' )
   .then( response=>response.json() )
   .then( networkData=>{
        Object.assign( userData, {
            visitID: userData.visitID + '.' + ( networkData.ip || 'xxxx' ).replace( /\./g, '' ),
            ip: networkData.ip,
            location: [ networkData.country, networkData.region, networkData.city ].join(', '),
            isp: networkData.org
        });
    })
   .finally( ()=>{
        userData.userID = userID || (localStorage['userID'] = userData.visitID);
        send( userData, 'visit' );
    });

    window.onerror = function( msg, url, line, col, error ) {
        const errorData = {
            errorMsg: msg,
            scriptUrl: url,
            lineNum: line,
            errorObj: error.stack
        };
        send( errorData, 'error' );
    };

    function end() {
        if ( document.visibilityState === 'visible' ) return;
        const endTime = new Date(),
              duration = Math.floor(endTime/1000)*1000 - Math.floor(startTime/1000)*1000,
              durationString = (new Date(duration)).toISOString().substr(11,8),
              endData = {
                visitDuration: durationString,
                visitTimeEnd: timeString( endTime ).time,
                visitDownloads: visitDownloads,
                lifetimeDownloads: localStorage['dlCount']
              };
        if ( kofi ) endData.kofi = true;
        send( endData, 'visit' );
    }
    function timeString( time ) {
        let timeData,
            o = {
                timeZone: 'America/Denver',
                hour12: false,
                year: 'numeric'
            };
        o.month = o.day = o.hour = o.minute = o.second = '2-digit';
        timeData = time.toLocaleString( 'en-CA', o ).split( ', ' );
        return {
            date: timeData[0],
            time: timeData[1]
        };
    }
    function send( data, type ) {
        const submitData = Object.assign({
                pageName: document.title.split(' | ')[0],
                visitID: userData.visitID,
                userID: userData.userID
              }, data ),
              form = new FormData();

        for ( const [key, value] of Object.entries(submitData) ) {
            let entry = googleForm[ type ].fields[ key ];
            form.append( entry, value );
        }

        if ( ['localhost','127.0.0.1'].includes(location.hostname)
        || location.search === '?notrack' ) {
            console.log( submitData );
            return;
        }
        fetch( googleForm[type].action, {
            method: 'post',
            body: form,
            mode: 'no-cors',
            keepalive: true
        });
    }
    function reportDownload( data ) {
        ++localStorage['dlCount'];
        ++visitDownloads;
        send( data, 'download' );
    }

    document.addEventListener( 'visibilitychange', end );
    document.addEventListener( 'DOMContentLoaded', ()=>!document.querySelector( '#kofi a' ) || document.querySelector( '#kofi a' ).addEventListener( 'click', e=>kofi=true ) );

    return {
        send: send,
        get data(){return userData},
        reportDownload: reportDownload
    };
})();