const express = require('express')

const port = 3000
const { Server } = require('socket.io');
const { createServer } = require('node:http');

const path = require('path')

const app = express()
const server = createServer(app);
const io = new Server(server);
var numUsuarios = 0;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
    console.log("me estan pidiendo la pagina principal")
})

app.use(express.static(path.join(__dirname, 'public')))

io.on('connection', (socket) => {
    numUsuarios++;
    console.log('Nuevo usuario. Tengo ' + numUsuarios + ' usuarios conectados');

    socket.on("unirseSala", (data) => {
        const { nombre, sala } = data;
        socket.nombre = nombre;
        unirseSala(socket, sala);
        socket.to(sala).emit("nuevoUsuarioEnSala", { nombre: nombre, sala: sala });
    });

    socket.on("nombre", (nombre) => {
        socket.nombre = nombre;
        io.emit("nuevaConexion", nombre)
    })

    socket.on("mensaje", (datos) => {
        console.log("Recibo mensaje: ", datos);
        if (socket.sala) {
            io.to(socket.sala).emit("server", datos);
        } else {
            io.emit("server", datos);
        }
    });

    socket.on("mensajeImagen", (datos) => {
        console.log("Recibo imagen: ", datos);
        if (socket.sala) {
            io.to(socket.sala).emit("serverImagen", datos);
        } else {
            io.emit("serverImagen", datos);
        }
    });

    socket.on('disconnect', () => {
        numUsuarios--;
        socket.broadcast.emit("desconexion", socket.nombre);
        console.log('Usuario desconectado, ahora hay ' + numUsuarios + ' conectados');
    });
});

function unirseSala(socket, sala) {
  if (socket.sala) {
      socket.leave(socket.sala);
      io.to(socket.sala).emit("usuarioSalio", { nombre: socket.nombre, sala: socket.sala });
      console.log(`${socket.nombre} salió de la sala: ${socket.sala}`);
      delete socket.sala;
      socket.emit("cambioSala", { enSala: false });
  } else {
      socket.join(sala);
      socket.sala = sala;
      console.log(`${socket.nombre} se unió a la sala: ${sala}`);
      socket.emit("cambioSala", { enSala: true, sala: sala });
  }
}


server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})