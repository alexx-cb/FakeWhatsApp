window.onload = () => {
    const socket = io();

    const listaSala = document.getElementById("listaSala");
    const input = document.getElementById("input");
    const imagen = document.getElementById("imagen");
    const miBoton = document.getElementById("enviar");
    const btnImagen = document.getElementById("enviarImagen");
    const botonesSala = document.querySelectorAll(".sala-btn");
    const nombreSala = document.getElementById("nombreSala");
    const salasContainer = document.getElementById("salasContainer");

    const landing = document.getElementById("landing");
    const chat = document.getElementById("chat");

    const usernameInput = document.getElementById("username");
    const avatars = document.querySelectorAll(".avatar");
    const startChat = document.getElementById("startChat");
    
    const userAvatar = document.getElementById("user-avatar");
    const userName = document.getElementById("user-name");

    const escribiendoIndicador = document.createElement("div");
    escribiendoIndicador.id = "escribiendo-indicador";
    escribiendoIndicador.classList.add("escribiendo-indicador");
    escribiendoIndicador.style.display = "none";
    
    const waInputArea = document.querySelector(".wa-input-area");
    waInputArea.parentNode.insertBefore(escribiendoIndicador, waInputArea);

    let nombreUsuario = "";
    let avatarSeleccionado = "";
    let salaActual = "publica";
    let typingTimer;
    let isTyping = false;

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
            landing.style.display = "none"; 
            chat.style.display = "block";
            
            userAvatar.src = `/img/${avatarSeleccionado}`;
            userName.textContent = nombreUsuario;
            
            socket.emit("nombre", { nombre: nombreUsuario, avatar: avatarSeleccionado });

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

    // escritura
    input.addEventListener("input", () => {
        if (!isTyping) {
            isTyping = true;
            socket.emit("escribiendo", { 
                nombre: nombreUsuario, 
                sala: salaActual 
            });
        }
        
        clearTimeout(typingTimer);
        
        typingTimer = setTimeout(() => {
            isTyping = false;
            socket.emit("dejoDeEscribir", { 
                nombre: nombreUsuario, 
                sala: salaActual 
            });
        }, 2000);
    });

    //usuario escribiendo
    socket.on("usuarioEscribiendo", (datos) => {
        if (datos.sala === salaActual && datos.nombre !== nombreUsuario) {
            if (datos.escribiendo) {
                escribiendoIndicador.textContent = `${datos.nombre} está escribiendo...`;
                escribiendoIndicador.style.display = "block";
            } else {
                escribiendoIndicador.style.display = "none";
            }
        }
    });

    // cambio de sala
    socket.on("cambioSala", (data) => {
        salaActual = data.sala;
        listaSala.innerHTML = "";
        
        // Ocultar el indicador de escritura al cambiar de sala
        escribiendoIndicador.style.display = "none";

        nombreSala.textContent = `Sala: ${salaActual}`;

        const li = document.createElement("li");
        li.innerText = `Te has unido a la sala ${data.sala}`;
        li.classList.add("sistema-mensaje");
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
            
            // dejar de escribir
            isTyping = false;
            clearTimeout(typingTimer);
            socket.emit("dejoDeEscribir", { 
                nombre: nombreUsuario, 
                sala: salaActual 
            });
        }
    });

    //enviar mensaje con Enter
    input.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            const mensaje = input.value.trim();
            if (mensaje !== "") {
                socket.emit("mensaje", { nombre: nombreUsuario, avatar: avatarSeleccionado, mensaje: mensaje, sala: salaActual });
                input.value = "";
                
                // dejar de escribir
                isTyping = false;
                clearTimeout(typingTimer);
                socket.emit("dejoDeEscribir", { 
                    nombre: nombreUsuario, 
                    sala: salaActual 
                });
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
                
                // dejar de escribir
                if (isTyping) {
                    isTyping = false;
                    clearTimeout(typingTimer);
                    socket.emit("dejoDeEscribir", { 
                        nombre: nombreUsuario, 
                        sala: salaActual 
                    });
                }
            };
            reader.readAsDataURL(archivo);
        }
    });

    // Recibir mensajes
    socket.on("server", (datos) => {
        if (datos.sala === salaActual) {
            // Si esta escribiendo
            if (datos.nombre !== nombreUsuario) {
                escribiendoIndicador.style.display = "none";
            }
            
            const li = document.createElement("li");
            
            // Si es un mensaje propio o de otro usuario
            if (datos.nombre === nombreUsuario) {
                li.classList.add("mensaje-propio");
                li.appendChild(document.createTextNode(`${datos.mensaje}`));
                
                // Agregar marca de tiempo
                const timeSpan = document.createElement("span");
                timeSpan.classList.add("mensaje-hora");
                timeSpan.textContent = obtenerHoraActual();
                li.appendChild(timeSpan);
                
                // Agregar doble check
                const checkSpan = document.createElement("span");
                checkSpan.classList.add("mensaje-check");
                checkSpan.innerHTML = '<i class="fas fa-check-double"></i>';
                li.appendChild(checkSpan);
            } else {
                li.classList.add("mensaje-otro");
                
                const img = document.createElement("img");
                img.src = `/img/${datos.avatar}`;
                img.alt = "Avatar";
                img.style.width = "30px";
                img.style.borderRadius = "50%";
                
                const messageContent = document.createElement("div");
                messageContent.classList.add("mensaje-contenido");
                
                const nombreElement = document.createElement("div");
                nombreElement.classList.add("mensaje-nombre");
                nombreElement.textContent = datos.nombre;
                
                const textoElement = document.createElement("div");
                textoElement.textContent = datos.mensaje;
                
                const timeSpan = document.createElement("span");
                timeSpan.classList.add("mensaje-hora");
                timeSpan.textContent = obtenerHoraActual();
                
                messageContent.appendChild(nombreElement);
                messageContent.appendChild(textoElement);
                messageContent.appendChild(timeSpan);
                
                li.appendChild(img);
                li.appendChild(messageContent);
            }
            
            listaSala.appendChild(li);
            listaSala.scrollTop = listaSala.scrollHeight;
        }
    });

    // Recibir imágenes
    socket.on("serverImagen", (datos) => {
        if (datos.sala === salaActual) {
            // Si esta escribiendo
            if (datos.nombre !== nombreUsuario) {
                escribiendoIndicador.style.display = "none";
            }
            
            const li = document.createElement("li");
            li.classList.add("mensaje-imagen");
            
            if (datos.nombre === nombreUsuario) {
                li.classList.add("mensaje-propio");
                
                const img = document.createElement("img");
                img.src = datos.mensaje;
                img.alt = "Imagen subida";
                img.style.maxWidth = "200px";
                img.style.borderRadius = "5px";
                img.style.cursor = "pointer";
                
                img.addEventListener("click", () => {
                    const link = document.createElement("a");
                    link.href = img.src;
                    link.download = datos.nombreArchivo || "descarga.png";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
                
                const timeSpan = document.createElement("span");
                timeSpan.classList.add("mensaje-hora");
                timeSpan.textContent = obtenerHoraActual();
                
                li.appendChild(img);
                li.appendChild(timeSpan);
            } else {
                li.classList.add("mensaje-otro");
                
                const avatarImg = document.createElement("img");
                avatarImg.src = `/img/${datos.avatar}`;
                avatarImg.alt = "Avatar";
                avatarImg.style.width = "30px";
                avatarImg.style.borderRadius = "50%";
                
                const messageContent = document.createElement("div");
                messageContent.classList.add("mensaje-contenido");
                
                const nombreElement = document.createElement("div");
                nombreElement.classList.add("mensaje-nombre");
                nombreElement.textContent = datos.nombre;
                
                const img = document.createElement("img");
                img.src = datos.mensaje;
                img.alt = "Imagen subida";
                img.style.maxWidth = "200px";
                img.style.borderRadius = "5px";
                img.style.cursor = "pointer";
                
                img.addEventListener("click", () => {
                    const link = document.createElement("a");
                    link.href = img.src;
                    link.download = datos.nombreArchivo || "descarga.png";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
                
                const timeSpan = document.createElement("span");
                timeSpan.classList.add("mensaje-hora");
                timeSpan.textContent = obtenerHoraActual();
                
                messageContent.appendChild(nombreElement);
                messageContent.appendChild(img);
                messageContent.appendChild(timeSpan);
                
                li.appendChild(avatarImg);
                li.appendChild(messageContent);
            }
            
            listaSala.appendChild(li);
            listaSala.scrollTop = listaSala.scrollHeight;
        }
    });

    // Mensaje cuando un usuario entra en una sala
    socket.on("nuevoUsuarioEnSala", (data) => {
        if (data.sala === salaActual) {
            const li = document.createElement("li");
            li.classList.add("sistema-mensaje");
            li.innerText = `${data.nombre} se ha unido a la sala ${data.sala}`;
            listaSala.appendChild(li);
            listaSala.scrollTop = listaSala.scrollHeight;
        }
    });

    // Mensaje cuando un usuario sale de una sala
    socket.on("usuarioSalio", (data) => {
        if (data.sala === salaActual) {
            const li = document.createElement("li");
            li.classList.add("sistema-mensaje");
            li.innerText = `${data.nombre} ha salido de la sala ${data.sala}`;
            listaSala.appendChild(li);
            listaSala.scrollTop = listaSala.scrollHeight;
        }
    });
    
    // Función para obtener la hora actual en formato HH:MM
    function obtenerHoraActual() {
        const ahora = new Date();
        const horas = ahora.getHours().toString().padStart(2, '0');
        const minutos = ahora.getMinutes().toString().padStart(2, '0');
        return `${horas}:${minutos}`;
    }
};