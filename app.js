const express = require('express')
const app = express()
const port = 8080
const cors = require('cors');
const fetch = require('node-fetch')

const baseURL = 'https://api.mercadolibre.com'

const maxResults = 4

app.use(cors());

function getData (url) {
    return fetch(url)
    .then(results => {
        return results.json()
    })
    
}

app.get('/items', ({query}, res) => {
    getData(`${baseURL}/sites/MLA/search?q=${query.q}&limit=${maxResults}`)
    .then(data => {
        return res.send({
            author: getAuthor(),
            categories: getCategories(data.results),
            items: getItems(data.results)
        })
    });
})

function getAuthor() {
    return {name: 'testName', lastname: 'testLastname'};
}

function getCategories(results) {
    categories = [];

    results.map((data) => {
        if(!categories.includes(data.category_id)) {
            categories.push(data.category_id);
        }
    });

    return categories;
}

function getItems(results) {
    items = [];

    results.map((data) => {
        items.push({
            id: data.id,
            title: data.title,
            price: getPrice(data),
            picture: data.thumbnail,
            condition: data.condition,
            free_shipping: data.shipping.free_shipping
            });
    });

    return items;
}

app.get('/items/:id', (req, res) => {
    var id = req.params.id;
    getData(`${baseURL}/items/${id}`)
    .then(dataFromItem => {
        return getData(`${baseURL}/items/${id}/description`).
            then(dataFromItemDescripcion => {
                if(dataFromItem.error) {
                    return res.send({
                        error: dataFromItem.error
                    })
                }

                return res.send({
                    author: getAuthor(),
                    item: getItemDescripcion(dataFromItem, dataFromItemDescripcion)
                })
            })
    });
});

function getPrice(data) {
    var price = data.price;

    return {
        currency: data.currency_id,
        amount: Math.floor(price),
        decimals: parseInt((price + "").split(".")[1])
    }
}

function getItemDescripcion(itemResult, itemDescriptionResult) {
    return {
        id: itemResult.id,
        title: itemResult.title,
        price: getPrice(itemResult),
        picture: getPicture(itemResult),
        condition: itemResult.condition,
        free_shipping: itemResult.shipping.free_shipping,
        sold_quantity: itemResult.sold_quantity,
        description: itemDescriptionResult.plain_text
    }
}

function getPicture(data) {
    return data.pictures[0].url;
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
