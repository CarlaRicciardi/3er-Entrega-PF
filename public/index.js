//0)conexion socket (front)
const socket = io();
socket.on('connect', () => {
  console.log('me conecteeeee');
});

//2) usuario completa form con producto nuevo. El envio lo hace el onclick en el form
const sendProd = () => {
  const title = document.getElementById('inputTitle').value;
  const price = document.getElementById('inputPrice').value;
  const thumbnail = document.getElementById('inputThumbnail').value;
  socket.emit('newProd', { title: title, price: price, thumbnail: thumbnail });
  //dejo el form en blanco
  document.getElementById('inputTitle').value = '';
  document.getElementById('inputPrice').value = '';
  document.getElementById('inputThumbnail').value = '';
  return;
};

const addToCart = () => {
  // cart = [];
  console.log('agregar al carrito');
};

const render = (data) => {
  let html = '';
  data.forEach((obj) => {
    html += `<tr>
    <td class='align-middle text-center'>${obj.title}</td>
    <td class='align-middle text-center'>$${obj.price}</td>
    <td class='align-middle text-center'><img src='${obj.thumbnail}' width='50' height='auto' class='img-fluid' /></td>
    <td class='align-middle text-center'><button type="button" class="btn btn-success" onclick='addToCart()'>Agregar al carrito</button></td>
    </tr>`;
  });
  //<button type="button" class="btn btn-success" onclick='addToCart()'>Agregar al carrito</button>
  //<a href="/cart" class="btn btn-success" onclick='addToCart()'>Agregar al carrito</a>
  //<input class='btn btn-success d-block mx-auto' onclick='addToCart()' type='submit' value='Enviar' />

  document.getElementById('productsList').innerHTML = html;
  //productsList viene de main.hbs - <tbody id='productsList'> // linea 40
};

//4) atrapar desde el front el array de productos actualizado
socket.on('products', (data) => {
  render(data);
});

//chat
const fyh = new Date().toLocaleDateString() + new Date().toTimeString();

const sendMsg = () => {
  const email = document.getElementById('input-email').value;
  const msgParaEnvio = document.getElementById('input-msg').value;
  socket.emit('newMsg', { email: email, fyh: fyh, mensaje: msgParaEnvio });
  document.getElementById('input-msg').value = '';
  return;
};

const chatRender = (data) => {
  let html = '';
  data.forEach((msg) => {
    html += ` 
    <li style="display: flex; flex-direction:row; ">
            <div id="autor" style="font-weight: bold; color:blue;" >
                ${msg.email} <span style="color: brown; font-weight:normal; margin-left:5px;">  ${fyh}  :</span> 
            </div>
            <div id="msj"  style="color: green; font-style: italic; margin-left:15px;">
               ${msg.mensaje}
            </div>
        </li>
    `;
  });
  document.getElementById('fullChat').innerHTML = html;
};

socket.on('msgs', (data) => {
  chatRender(data);
});
