window.onload = () => {
    const socket = io();
    const lista = document.getElementById("lista");
    const listaSala = document.getElementById("listaSala")
    const input = document.getElementById("input");
    const imagen = document.getElementById("imagen");
    const miBoton = document.getElementById("enviar");
    const btnImagen = document.getElementById("enviarImagen");

    const nombreSala = "salaPrueba";

    const nombreUsuario = prompt("Dame tu nombre");

    const bntSala = document.getElementById("unirseSala");

    let enSala = false;

    socket.emit("nombre", nombreUsuario)

    miBoton.addEventListener("click", () => {
        const mensaje = input.value.trim();
        if (mensaje !== "") {
            socket.emit("mensaje", { nombre: nombreUsuario, mensaje: mensaje });
            input.value = "";
        }
    });

    btnImagen.addEventListener("click", () => {
        const url = imagen.value.trim();
        if (url !== "") {
            socket.emit("mensajeImagen", { nombre: nombreUsuario, mensaje: url });
            imagen.value = "";
        }
    });

    bntSala.addEventListener("click", () => {
        socket.emit("unirseSala", { nombre: nombreUsuario, sala: nombreSala });
    });

    socket.on("nuevoUsuarioEnSala", (data) => {
        if (enSala) {
            const li = document.createElement("li");
            li.innerText = data.nombre + " se ha conectado a la sala Privada"
            listaSala.appendChild(li);
        }
    });

    socket.on("nuevaConexion", (nombre) => {
        if (!enSala) {
            const li = document.createElement("li");
            li.innerText = nombre + " se ha conectado a la sala"
            lista.appendChild(li);
        }
    });

    socket.on("cambioSala", (data) => {
        enSala = data.enSala;
        if (enSala) {
            lista.innerHTML = '';
            const li = document.createElement("li");
            li.innerText = `Te has unido a la sala ${data.sala}`;
            listaSala.appendChild(li);
        } else {
            listaSala.innerHTML = '';
            const li = document.createElement("li");
            li.innerText = "Te has unido a la sala pública";
            lista.appendChild(li);
        }
    });
    
    socket.on("usuarioSalio", (data) => {
        if (enSala) {
            const li = document.createElement("li");
            li.innerText = `${data.nombre} ha salido de la sala ${data.sala}`;
            listaSala.appendChild(li);
        }
    });

    socket.on("desconexion", (nombre) => {
        const li = document.createElement("li");
        li.innerText = nombre + " se ha desconectado"
        if (enSala) {
            listaSala.appendChild(li);
        } else {
            lista.appendChild(li);
        }
    });

    socket.on("server", (datos) => {
        const li = document.createElement("li");
        li.textContent = `${datos.nombre}: ${datos.mensaje}`;
        if (enSala) {
            listaSala.appendChild(li);
        } else {
            lista.appendChild(li);
        }
    });

    socket.on("serverImagen", (datos) => {
        const li = document.createElement("li");
        const nombreSpan = document.createElement("span");
        nombreSpan.textContent = `${datos.nombre}: `;
        const img = document.createElement("img");
        img.src = datos.mensaje;
        img.style.maxWidth = "200px";
        li.appendChild(nombreSpan);
        li.appendChild(img);
        if (enSala) {
            listaSala.appendChild(li);
        } else {
            lista.appendChild(li);
        }
    });
};