window.onload = () => {
    const socket = io();

    // Elementos del DOM
    const listaSala = document.getElementById("listaSala");
    const input = document.getElementById("input");
    const imagen = document.getElementById("imagen");
    const miBoton = document.getElementById("enviar");
    const btnImagen = document.getElementById("enviarImagen");
    const botonesSala = document.querySelectorAll(".sala-btn");
    const nombreSala = document.getElementById("nombreSala");
    const salasContainer = document.getElementById("salasContainer"); // Contenedor de botones de sala

    const landing = document.getElementById("landing");
    const chat = document.getElementById("chat");

    const usernameInput = document.getElementById("username");
    const avatars = document.querySelectorAll(".avatar");
    const startChat = document.getElementById("startChat");

    let nombreUsuario = "";
    let avatarSeleccionado = "";
    let salaActual = "publica"; // Entra automáticamente a la sala pública

    // Seleccionar avatar
    avatars.forEach(avatar => {
        avatar.addEventListener("click", () => {
            avatars.forEach(a => a.classList.remove("selected"));
            avatar.classList.add("selected");
            avatarSeleccionado = avatar.dataset.avatar;
        });
    });

    // Iniciar sesión y entrar automáticamente a la sala pública
    startChat.addEventListener("click", () => {
        nombreUsuario = usernameInput.value.trim();
        if (nombreUsuario !== "" && avatarSeleccionado !== "") {
            landing.style.display = "none"; // Oculta pantalla de inicio
            chat.style.display = "block"; // Muestra el chat
            
            socket.emit("nombre", { nombre: nombreUsuario, avatar: avatarSeleccionado });

            // Unirse automáticamente a la sala pública
            socket.emit("cambiarSala", { 
                nombre: nombreUsuario, 
                avatar: avatarSeleccionado, 
                nuevaSala: "publica",
                salaAnterior: ""
            });
        } else {
            alert("Por favor, ingresa un nombre y selecciona un avatar.");
        }
    });

    // Cambiar de sala con los botones
    botonesSala.forEach(boton => {
        boton.addEventListener("click", () => {
            const nuevaSala = boton.dataset.sala;

            if (nuevaSala !== salaActual) {
                socket.emit("cambiarSala", { 
                    nombre: nombreUsuario, 
                    avatar: avatarSeleccionado, 
                    nuevaSala, 
                    salaAnterior: salaActual 
                });
            }
        });
    });

    // Evento cuando el usuario cambia de sala
    socket.on("cambioSala", (data) => {
        salaActual = data.sala;
        listaSala.innerHTML = ""; // Limpiar mensajes anteriores

        nombreSala.textContent = `Sala: ${salaActual}`;

        const li = document.createElement("li");
        li.innerText = `Te has unido a la sala ${data.sala}`;
        listaSala.appendChild(li);

        // Resaltar el botón de la sala actual
        botonesSala.forEach(boton => {
            if (boton.dataset.sala === salaActual) {
                boton.classList.add("active");
            } else {
                boton.classList.remove("active");
            }
        });
    });

    // Enviar mensaje
    miBoton.addEventListener("click", () => {
        const mensaje = input.value.trim();
        if (mensaje !== "") {
            socket.emit("mensaje", { nombre: nombreUsuario, avatar: avatarSeleccionado, mensaje: mensaje, sala: salaActual });
            input.value = "";
        }
    });

    // Permitir enviar mensaje con Enter
    input.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            const mensaje = input.value.trim();
            if (mensaje !== "") {
                socket.emit("mensaje", { nombre: nombreUsuario, avatar: avatarSeleccionado, mensaje: mensaje, sala: salaActual });
                input.value = "";
            }
        }
    });

    // Enviar imagen
    btnImagen.addEventListener("click", () => {
        const archivo = imagen.files[0];
        if (archivo) {
            const reader = new FileReader();
            reader.onload = function(event) {
                socket.emit("mensajeImagen", {
                    nombre: nombreUsuario,
                    avatar: avatarSeleccionado,
                    mensaje: event.target.result,
                    nombreArchivo: archivo.name,
                    sala: salaActual
                });
                imagen.value = "";
            };
            reader.readAsDataURL(archivo);
        }
    });

    // Recibir mensajes
    socket.on("server", (datos) => {
        if (datos.sala === salaActual) {
            const li = document.createElement("li");
            const img = document.createElement("img");
            img.src = `/img/${datos.avatar}`;
            img.alt = "Avatar";
            img.style.width = "30px";
            img.style.borderRadius = "50%";
            li.appendChild(img);
            li.appendChild(document.createTextNode(` ${datos.nombre}: ${datos.mensaje}`));
            listaSala.appendChild(li);
        }
    });

    // Recibir imágenes
    socket.on("serverImagen", (datos) => {
        if (datos.sala === salaActual) {
            const li = document.createElement("li");
            const nombreSpan = document.createElement("span");
            const imgAvatar = document.createElement("img");
            imgAvatar.src = `/img/${datos.avatar}`;
            imgAvatar.alt = "Avatar";
            imgAvatar.style.width = "30px";
            imgAvatar.style.borderRadius = "50%";
            nombreSpan.appendChild(imgAvatar);
            nombreSpan.appendChild(document.createTextNode(` ${datos.nombre}: `));

            const img = document.createElement("img");
            img.src = datos.mensaje;
            img.alt = "Imagen subida";
            img.style.maxWidth = "200px";
            img.style.cursor = "pointer";
            img.addEventListener("click", () => {
                const link = document.createElement("a");
                link.href = img.src;
                link.download = datos.nombreArchivo || "descarga.png";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });

            li.appendChild(nombreSpan);
            li.appendChild(img);
            listaSala.appendChild(li);
        }
    });

    // Mensaje cuando un usuario entra en una sala
    socket.on("nuevoUsuarioEnSala", (data) => {
        if (data.sala === salaActual) {
            const li = document.createElement("li");
            li.innerText = `${data.nombre} se ha unido a la sala ${data.sala}`;
            listaSala.appendChild(li);
        }
    });

    // Mensaje cuando un usuario sale de una sala
    socket.on("usuarioSalio", (data) => {
        if (data.sala === salaActual) {
            const li = document.createElement("li");
            li.innerText = `${data.nombre} ha salido de la sala ${data.sala}`;
            listaSala.appendChild(li);
        }
    });
};