
const { v4: uuid } = require("uuid")
const { WebSocket, WebSocketServer } = require("ws")

const PORT = 4000
let socket_client_id = []

const main = () => {

    const wss = new WebSocketServer({
        port: PORT,
        clientTracking: true
    })

    wss.on("headers", (headers, request) => {
        console.log("Socket Server Headers: ", JSON.stringify(headers, null, 4))
        console.log("Socket Server Headers Request Status Code: ", request.statusCode)
        console.log("Socket Server Headers Request Status Message: ", request.statusMessage)
    })
    wss.on("listening", () => {
        console.log("Socket Server is Listening on Port: ", PORT)
    })
    wss.on("error", (error) => {
        console.log("Socket Server Error: ", error)
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN || client.readyState === WebSocket.CONNECTING) {

                if (socket_client_id.includes(client.id)) {
                    client.close(1006, "Error Occurred on Socket Server side!")
                    socket_client_id = socket_client_id.filter(i => i !== client.id)
                }
            }
        })
    })
    wss.on("close", () => {
        console.log("Socket Server Closed.")
        main()
    })
    wss.on("connection", (socket, request) => {

        socket.id = uuid()
        socket_client_id.push(socket.id)

        console.log("Socket Client joined with id as ", socket.id)

        socket.send(JSON.stringify({
            status: true,
            id: socket.id,
            message: "Connection with Socket Sever is successful with your connection id as " + socket.id
        }), (_error) => {
            _error && console.log("Socket Client Send Message Error: ", _error)
        })

        socket.on("error", (error) => {

            console.log("Socket Client Error: ", error)
            socket.close()
        })
        socket.on("close", (code, reason) => {

            console.log("Socket Client Close Code: ", code)
            console.log("Socket Client Close Reason: ", Buffer.from(reason).toString())

            socket_client_id = socket_client_id.filter(id => id !== socket.id)
            console.log("Number of Socket Clients connected is ", wss.clients.size, "with their ids as ", socket_client_id)
        })
        socket.on("open", () => {

            console.log("Socket Client connection opened.")
        })
        socket.on("unexpected-response", (request, response) => {

            console.log("Socket Client Unexpected Response's Response Status Code: ", response.statusCode)
            console.log("Socket Client Unexpected Response's Response Status Message: ", response.statusMessage)
        })
        socket.on("ping", (data) => {

            console.log("Socket Client Ping Data: ", Buffer.from(data).toString())
        })
        socket.on("pong", (data) => {

            console.log("Socket Client Pong Data: ", Buffer.from(data).toString())
        })
        socket.on("upgrade", (request) => {

            console.log("Socket Client Upgrade Request Status Code: ", request.statusCode)
            console.log("Socket Client Upgrade Request Status Message: ", request.statusMessage)
        })
        socket.on("message", (data, isBinary) => {

            console.log("Socket Client Message Data: ", Buffer.from(data).toString())
            console.log("Socket Client Message Is Binary: ", isBinary)

            try {
                data = JSON.parse(Buffer.from(data).toString())

                

                wss.clients.forEach(client => {
                    if (client.id === socket.id) {
                        socket.send(JSON.stringify({
                            status: true,
                            id: socket.id,
                            message: "Socket Server Received Data"
                        }), (_error) => {
                            _error && console.log("Socket Client Send Message Error: ", _error)
                        })
                    }
                })
            } catch (error) {
                console.log("Socket Server Received Bad Data from Socket Client with id as ", socket.id)
                wss.clients.forEach(client => {
                    if (client.id === socket.id) {
                        socket.send(JSON.stringify({
                            status: false,
                            id: socket.id,
                            message: "Socket Server Received Bad Data",
                            received_data: Buffer.from(data).toString()
                        }), (_error) => {
                            _error && console.log("Socket Client Send Message Error: ", _error)
                        })
                    }
                })
            }
        })
    })
}
main()
