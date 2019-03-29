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


{   
    let getFileFromBlob = (data, config = { type: 'text/plain' }) => {
        let blob = new Blob([JSON.stringify(data)], config);
        let file = URL.createObjectURL(blob);
        
        let link = document.createElement('a'); 
        link.href = file; 
        link.download = 'cilindr_nasad.json'; 
        link.click();
    }
    
    let priceCalculation = (price) => {
        price = Math.round(price);
        if (price <= 5000) return price*2;
        if (price <=10000) return price*1.5;
        if (price > 10000) return price+5000;
    }
    
    //Фреза цилиндрическая насадная 100х125х40 Z=14 Р6М5
    let workingWithName = (name) => {
        
        let kolvoZubiev = name.match(/Z{1}\s?={1}\s?\d{1,3}/gi)[0].replace(/Z{1}\s?={1}\s?/,'');
        let material = name.match(/Z{1}\s?={1}\s?\d{1,3}\s.+/gi)[0].replace(/Z{1}\s?={1}\s?\d{1,3}\s/,'');
        let diametr = name.match(/\d{1,3},?\d{1,3}\s?х/gi)[0].replace('х','');
        let dlina = name.match(/\d{1,3},?\d{1,3}\s?х/gi)[1].replace('х','');
        
        let htmlBody = 
            '<h2 class="header_group">Описание</h2><p><b>' 
            + name.replace(/Z.+/, `, количество зубьев - ${kolvoZubiev}, материал - ${material}`) 
            + '</b></p>';
    
        let seoTitle = name + ' - Цилиндрические насадные' + " - Каталог оборудования | Станкопромышленная компания";
        let seoKeyWords = 'фреза, цилиндрическая, насадная, материал, ' + material + ', диаметр, ' + diametr;
    
        return { htmlBody, diametr, kolvoZubiev, material, dlina, seoTitle, seoDescription: name, seoKeyWords };
    }
    
    let tableRows = document.querySelectorAll('.b_items_list tbody tr');
    let arr = [];
    tableRows.forEach( (el,idx) => {
        
        let sku = el.querySelector('.bil_id span').innerText;
        let price = priceCalculation( +el.querySelector('.bil_price').innerText );
        let additionInfo = workingWithName( el.querySelector('[itemprop="url"] span').innerText );
    
        let data = { sku, price, id: `cilind_nasad_${idx}`, ...additionInfo };
        arr.push( JSON.stringify(data) );
    });
    
    
    getFileFromBlob(arr);
} // get
