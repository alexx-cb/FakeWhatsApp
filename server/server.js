const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const { Server } = require('socket.io');
const { createServer } = require('http');
const port = process.env.PORT || 3000;
const app = express();
const server = createServer(app);
const io = new Server(server);
let numUsuarios = 0;

app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.post('/upload', (req, res) => {
    if (!req.files || !req.files.imagen) {
        return res.status(400).json({ error: 'No files were uploaded.' });
    }
    let imagen = req.files.imagen;
    let fileName = Date.now() + path.extname(imagen.name);
    let uploadPath = path.join(__dirname, 'public/uploads', fileName);
    imagen.mv(uploadPath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al subir la imagen' });
        }
        res.json({ imageUrl: `/uploads/${fileName}` });
    });
});

io.on('connection', (socket) => {
    numUsuarios++;
    console.log(`Nuevo usuario conectado. Usuarios activos: ${numUsuarios}`);
    
    socket.on("nombre", (data) => {
        socket.nombre = data.nombre;
        socket.avatar = data.avatar;
        io.emit("nuevaConexion", data);
    });
    
    socket.on("mensaje", (datos) => {
        if (datos.sala) {
            io.to(datos.sala).emit("server", datos);
        } else {
            io.emit("server", datos);
        }
    });
    
    socket.on("mensajeImagen", (datos) => {
        if (datos.sala) {
            io.to(datos.sala).emit("serverImagen", datos);
        } else {
            io.emit("serverImagen", datos);
        }
    });
    
    // Nuevo evento para cambiar de sala directamente
    socket.on("cambiarSala", (data) => {
        const { nombre, avatar, nuevaSala, salaAnterior } = data;
        socket.nombre = nombre;
        socket.avatar = avatar;
        
        // Si ya estaba en una sala, salir de ella
        if (salaAnterior) {
            socket.leave(salaAnterior);
            socket.to(salaAnterior).emit("usuarioSalio", { 
                nombre: nombre, 
                sala: salaAnterior 
            });
        }
        
        // Unirse a la nueva sala
        socket.join(nuevaSala);
        socket.sala = nuevaSala;
        
        // Notificar al cliente que cambió de sala
        socket.emit("cambioSala", { sala: nuevaSala });
        
        // Notificar a los demás usuarios de la sala
        socket.to(nuevaSala).emit("nuevoUsuarioEnSala", { 
            nombre: nombre, 
            avatar: avatar, 
            sala: nuevaSala 
        });
    });
    
    socket.on('disconnect', () => {
        numUsuarios--;
        
        // Si estaba en una sala, notificar que salio
        if (socket.sala) {
            socket.to(socket.sala).emit("usuarioSalio", { 
                nombre: socket.nombre, 
                sala: socket.sala 
            });
        }
        
        socket.broadcast.emit("desconexion", socket.nombre);
        console.log(`Usuario desconectado. Usuarios activos: ${numUsuarios}`);
    });
});

server.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});