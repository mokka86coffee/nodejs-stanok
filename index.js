{

    const axios = require('axios');
    const fs = require('fs');

    const urlMain = 'https://stanok74.ru/katalog/internet-magazin/stroitelnoe-oborudovanie/rabota-s-armaturoj/elektricheskie-stanki-rezki';
    const urlPart = 'rabota-s-armaturoj/elektricheskie-stanki-rezki';
    
    (async()=>{
    
    console.log(''); console.log('started - ', urlPart); console.log('--------------'); console.log('');
    
    let errorCounter = { err: 0, errors: [], imgs: [] };

    for ( let i=0; i< 1180; i+=12 ) {
        const url = !i
            ? urlMain
            : `${urlMain}?action=rsrtme&catid=20107&offset=${i}`;


        try {
            let pagesUrls = await getProductsLinksFromCatalog(url, urlPart);
    
            for (page of pagesUrls) {
                let ImgsFromPageArr = await getImgsLinksFromPage(page);

                await checkForBrokenImgs(ImgsFromPageArr, page, errorCounter);
            }


        } catch (err) {
            if ( err.message === 'no more items left' ) { break; }
            else { console.log(err.message); errorCounter.error++; }
        }


    }

    if (!errorCounter.err) { console.log('All images are ok') }
    else { 
        let errors = errorCounter.errors.filter( (el,idx,arr) => idx == arr.indexOf(el) );
        errors.forEach(err => { console.log(err) });
        
        fs.writeFileSync('./links.html', '', ()=>{}); 
        let imgErrors = errorCounter.imgs.filter( (el,idx,arr) => idx == arr.indexOf(el) );
        imgErrors.forEach(link => fs.appendFileSync('./links.html', `${link}\n`) ); 
            
        console.log(`Need to add ${imgErrors.length} image${imgErrors.length > 1 ? 's' : ''} on ${errors.length} page${errors.length > 1 ? 's' : ''}`);
    }
    
    console.log(''); console.log('--------------'); console.log('done');

  })()

  
async function checkForBrokenImgs (links, page, errorCounter) {
    for (let link of links) {
        try {
            await axios.get(link); 
        } catch (err) {
            errorCounter.err++;
            errorCounter.errors.push('https://stanok74.ru/' + page);
            errorCounter.imgs.push(link);
        }
    }

}

async function getImgsLinksFromPage (pageUrl) {

    const urlmain = 'https://stanok74.ru/';

    const response = await axios.get(urlmain+pageUrl);
    let strings = response.data.split('<img');

    return strings
    .filter(str => !~str.indexOf('eshop-item-small__img'))
    .map( str => str.match(/_mod_files.+?(jp(e)?g|png|webp)+?/g) )
    .filter( str => str )
    .reduce( (res,str) => {
       return res.concat( str.map( el => urlmain + el ) )
    }, [] )
    .filter( (str,idx,arr) => arr.indexOf(str) === idx );
}

async function getProductsLinksFromCatalog (pageUrl, partUrl) {
    try {
        const response = await axios.get(pageUrl);
        let strings = response.data.split('\n');

        strings = strings
            .filter( str => ~str.indexOf(partUrl) && ~str.indexOf('href') && !~str.indexOf('offset') && ( new RegExp(partUrl + '\/.+', 'g') ).test(str) );
        
        if (!strings.length) { throw new Error('no more items left') };
        
        strings = strings
            .map( str => str.match(/katalog\/internet-magazin\/.+?("|')+?/g)[0].slice(0,-1) )
            // .filter( str => str && !(/yandex/gi).test(str[0]) && !(/amiro/).test(str[0]) )
            // .map( str => urlmain + str[0] );

        return strings.filter( (str, idx) => idx == strings.indexOf(str) );
    } catch (err) {
        if (err.message === 'no more items left') { throw new Error('no more items left') }
        else { console.log(err.message) }
       
    }
}

}