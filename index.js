const mysql = require('mysql2');
const fs = require('fs');

const connection = mysql.createConnection({
    host:   'localhost',
    user:   'bondibon',
    database:   'bondibon',
    password:   'bondibon',
    multipleStatements: true
    //port:       8889
});

let fields = [
                { name: 'UF_TITLE', type: 'text' },
                { name: 'UF_PAGEID', type: 'text' }
             ];
let hlBlock = {
    name: 'Testpages',
    language:   [
                    { lid: 'ru', name: 'Тестовый блок'},
                    {lid: 'en', name: 'Test block'}
                ],
    table: 'bb_test_pages3',
    fields : [
                { name: 'UF_TITLE', type: 'text' },
                { name: 'UF_PAGEID', type: 'text' }
            ]
};
createHlblock(hlBlock);
// const pages = readLinks();

/* 1. Проверка, есть таблица в БД или нет */
async function createHlblock(hlBlock) {
    connection.promise().query('SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = ?',[hlBlock.table])
        .then( ([rows, fields]) => {
            if(rows.length > 0) {
                console.log(`Таблица ${ hlBlock.table } существует в БД`);
                connection.end();
            }
            else {
                console.log(`Таблица ${hlBlock.table} в базе не найдена`);
                createHlblockTable(hlBlock);
            }
        })
        .catch(error => {
            console.error(error);
        });
}
/* 2. Создание таблицы в БД */
async function createHlblockTable(hlBlock) {
    connection.promise().query(`CREATE TABLE ${hlBlock.table} ( ID int NOT NULL AUTO_INCREMENT, PRIMARY KEY (ID));`)
        .then(() => {
            let sqlQuery = `ALTER TABLE ${hlBlock.table} `;
            hlBlock.fields.forEach(field => {
                sqlQuery += `ADD COLUMN ${field.name} ${field.type},`;
            });
            connection.promise().query(sqlQuery.slice(0,-1))
                .then(() => {
                    console.log(`Таблица ${hlBlock.table} создана`);
                })
                .catch(err => {
                    console.log(err);
                });
            addHlblockEntity(hlBlock);
        })
        .catch(err => {
            console.log(err);
            connection.end();
        })
}

/* 3. Добавление новой записи в список Hightload-блоков */
async function addHlblockEntity(hlBlock) {
    connection.promise().query(`INSERT INTO b_hlblock_entity (NAME, TABLE_NAME) VALUES ('${hlBlock.name}','${hlBlock.table}' )`)
        .then(([result,fields]) => {
            console.log(`Запись для таблицы ${hlBlock.table} для highloadblock-а ${hlBlock.name} создана. ID - ${result.insertId}`);
            hlBlock.id = result.insertId;
            addHlblockLang(hlBlock);
        })
        .catch(error => {
            console.error(error);
        });
}
/* 4. Добавление названий на русском и английском языках для HighLoad-блока  */
async function addHlblockLang(hlBlock) {
    let sqlQuery = 'INSERT INTO b_hlblock_entity_lang (ID, LID, NAME)' + ' VALUES';
    hlBlock.language.forEach(lang => {
        sqlQuery += `('${hlBlock.id}', '${lang.lid}', '${lang.name}'),`;
    })
    connection.promise().query(sqlQuery.slice(0,-1))
        .then(([result,fields]) => {
            console.log(`Добавлены ${result.affectedRows} названий для highloadblock-а ${hlBlock.name}`)
            addHlblockUserFields(hlBlock);
        })
        .catch(error => {
            console.error(error);
        });
}

/* 5. Добавление записей в таблицу пользовательских типов  */
async function addHlblockUserFields(hlBlock) {
    //
    // ID
    // ENTITY_ID
    // FIELD_NAME
    // USER_TYPE_ID
    // XML_ID
    // SORT
    // MULTIPLE
    // MANDATORY
    // SHOW_FILTER
    // SHOW_IN_LIST
    // EDIT_IN_LIST
    // IS_SEARCHABLE
    // SETTINGS

    // HLBLOCK_7
    // UF_SHOP
    // hlblock
    // 100
    // N
    // N
    // N
    // Y
    // Y
    // N
    // a:5:{s:7:"DISPLAY";s:4:"LIST";s:11:"LIST_HEIGHT";i:5;s:10:"HLBLOCK_ID";i:9;s:10:"HLFIELD_ID";i:106;s:13:"DEFAULT_VALUE";i:0;}
    // a:5:{s:7:"DISPLAY";s:4:"LIST";s:11:"LIST_HEIGHT";i:5;s:10:"HLBLOCK_ID";i:10;s:10:"HLFIELD_ID";i:109;s:13:"DEFAULT_VALUE";i:0;}
}


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
