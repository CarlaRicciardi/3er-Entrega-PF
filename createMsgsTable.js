const { options } = require('./options/sqlite3.js');
const knex = require('knex')(options);

// knex.schema
//   .createTable('msgsTable2', (table) => {
//     table.string('email'), table.string('fyh'), table.string('mensaje');
//   })
//   .then(() => {
//     console.log('tabla creada');
//   })
//   .catch((err) => {
//     console.log(err);
//     throw new Error(err);
//   })
//   .finally(() => {
//     knex.destroy();
//   });

const fyh = new Date().toLocaleDateString() + new Date().toTimeString();

knex('msgsTable2')
  .insert({ email: 'Carla@gmail.com', fyh: fyh, mensaje: 'hola a todos!' })
  .then(() => {
    console.log('logré insertar mensaje');
  })
  .catch((err) => {
    console.log(err);
  })
  .finally(() => {
    knex.destroy();
  });
