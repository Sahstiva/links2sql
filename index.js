const mysql = require('mysql2');
const fs = require('fs');

const connection = mysql.createConnection({
    host:   'localhost',
    user:   'bondibon',
    database:   'bondibon',
    password:   'bondibon',
    port:       8889
});

const pages = readLinks();

async function readLinks() {
    fs.readFile('links.json', 'utf8',(error, data) => {
        if(error)
            throw error;
        const pages = JSON.parse(data).pages;
        let shops = [];
        pages.forEach(page => {
            addPage(page);
            page.sections.forEach(section => {
                section.links.forEach(link => {
                    if(shops.indexOf(link.shop) < 0)
                        shops.push(link.shop);
                })
            });
        });
        console.log(`Найдено ${shops.length} магазинов`);
        shops.forEach(shop => {
            addShops(shop);
        });
    });
}
async function addPage(page) {
    connection.promise().query('SELECT ID FROM `bb_landing_pages` WHERE `UF_TITLE` = ?',[page.title])
        .then( ([rows, fields]) => {
            if(rows.length > 0) {
                const page_id = rows.pop().ID;
                console.log(`Страница ${page.title} найдена, ID - ${ page_id }`);
                page.sections.forEach(section => {
                    addSection(section, page_id);
                })
            }
            else {
                console.log(`Страница ${page.title} в базе не найдена`);
                connection.promise().query('INSERT INTO `bb_landing_pages` (UF_TITLE, UF_PAGEID) VALUES (?, ?)',[page.title, page.id])
                    .then(() => {
                        console.log('Запись добавлена');
                    })
                    .catch(error => {
                        console.error(error);
                    });
            }
        })
        .catch(error => {
            console.error(error);
            return false;
        })
}

async function addSection(section, page_id) {
    connection.promise().query('SELECT ID FROM `bb_landing_sections` WHERE `UF_TEXT` = ? AND UF_PAGE = ?',[section.text, page_id])
        .then( ([rows, fields]) => {
            if(rows.length > 0) {
                const section_id = rows.pop().ID;
                console.log(`Раздел ${ section.text } найден, ID - ${ section_id }`);
                section.links.forEach(link => {
                    addLink(link);
                })
            }
            else {
                console.log(`Раздел ${ section.text } в базе не найден`);
                connection.promise().query('INSERT INTO `bb_landing_sections` (UF_TEXT, UF_PAGE) VALUES (?, ?)',[section.text, page_id])
                    .then(() => {
                        console.log('Запись добавлена');
                    })
                    .catch(error => {
                        console.error(error);
                    });
            }
        })
        .catch(error => {
            console.error(error);
        });
}
async function addShops(shop) {
    connection.promise().query('SELECT ID FROM `bb_landing_shops` WHERE `UF_SHOP` = ?',[shop])
        .then( ([rows, fields]) => {
            if(rows.length > 0) {
                const shop_id = rows.pop().ID;
                console.log(`Магазин ${ shop } найден, ID - ${ shop_id }`);
            }
            else {
                console.log(`Магазин ${ shop } в базе не найден`);
                connection.promise().query('INSERT INTO `bb_landing_shops` (UF_SHOP) VALUES (?)',[shop])
                    .then(() => {
                        console.log('Запись добавлена');
                    })
                    .catch(error => {
                        console.error(error);
                    });
            }
        })
        .catch(error => {
            console.error(error);
        });
}
async function addLink(link) {
    connection.promise().query('SELECT ID FROM `bb_landing_shops` WHERE `UF_SHOP` = ?',[shop])
        .then( ([rows, fields]) => {
            if(rows.length > 0) {
                const shop_id = rows.pop().ID;
                console.log(`Магазин ${ shop } найден, ID - ${ shop_id }`);
            }
            else {
                console.log(`Магазин ${ shop } в базе не найден`);
                connection.promise().query('INSERT INTO `bb_landing_shops` (UF_SHOP) VALUES (?)',[shop])
                    .then(() => {
                        console.log('Запись добавлена');
                    })
                    .catch(error => {
                        console.error(error);
                    });
            }
        })
        .catch(error => {
            console.error(error);
        });
}
