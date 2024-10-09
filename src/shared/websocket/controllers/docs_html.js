export default `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Websocket API Docs</title>
            <style>
                html
                {
                    box-sizing: border-box;
                    overflow: -moz-scrollbars-vertical;
                    overflow-y: scroll;
                }
                *,
                *:before,
                *:after
                {
                    box-sizing: inherit;
                }
                body
                {
                    margin: 0;
                    padding: 3em;
                    background: #fafafa;
                    font-family: "arial", sans-serif;
                }

                .title {
                    margin-top: 0;
                }

                .flex {
                    display: flex;
                    gap: 1em;
                }

                .flex p {
                    margin: 0;
                }

                .flex.between {
                    justify-content: space-between;
                }

                .flex.center {
                    items-content: center;
                }

                pre {
                    background: #f4f4f4;
                    border: 1px solid #ddd;
                    border-left: 3px solid #f36d33;
                    color: #666;
                    page-break-inside: avoid;
                    font-family: monospace;
                    font-size: 15px;
                    line-height: 1.6;
                    margin-bottom: 1.6em;
                    max-width: 100%;
                    overflow: auto;
                    padding: 1em 1.5em;
                    display: block;
                    word-wrap: break-word;
                }

                .bold {
                    font-weight: bold;
                }

                .badge {
                    background: #555;
                    color: #fff;
                    display: inline-block;
                    padding: 0.5em 1em;
                    border-radius: 0.25em;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8em;
                }

                .no-margin {
                    margin: 0;
                }

                .mb-1 {
                    margin-bottom: 1em;
                }

                .mb-3 {
                    margin-bottom: 3em;
                }

                .w-full {
                    width: 100%;
                }

                hr {
                    border: 1px solid #ddd;
                    margin: 1em 0;
                }

                .card {
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 1em;
                    margin-bottom: 1em;
                }
                .ct {
                    color: orange;
                }
            </style>
        </head>
        <body>
            <h1 class="title">Websocket API Docs</h1>
            <p class="bold">Connect</p>
            <pre>
const socket = new WebSocket('ws://localhost:${process.env.WEBSOCKET_PORT}');
socket.onopen = () => { console.log('Connected to websocket server'); };
socket.onclose = () => { console.log('Disconnected from websocket server'); };
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.error) {
        // Handle error
        console.error(data.error);
    } else {
        // Handle payload
        const { type, payload } = data;
        console.log(type, payload);
    }
};
// Send payload to the websocket server
socket.send("{ 'type': 'event_type', obj1, obj2 }"));
            </pre>
            <hr />
            <h2 class="title">Server Events</h2>
            <div class="card">
                <div class="mb-1">
                   <div class="flex center between mb-1">
                        <h3 class="no-margin ctrl">Channel Message Controller</h3>
                        <div class="badge">Event Type: <span class="type">chat_message_created</span></div>
                    </div>
                    <p class="no-margin">
                        Description: a new message has been created in a channel.
                    </p>
                </div>
                <div class="card-body">                    
                    <div class="flex">
                        <div>
                            <p class="bold">Type:</p>
                            <pre>chat_message_created</pre>
                        </div>
                        <div class="w-full">
                            <p class="bold">Payload:</p>
                            <pre>{ <span class="ct">ChannelMessage</span> }</pre>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="mb-1">
                   <div class="flex center between mb-1">
                        <h3 class="no-margin ctrl">Channel Message Controller</h3>
                        <div class="badge">Event Type: <span class="type">chat_message_updated</span></div>
                    </div>
                    <p class="no-margin">
                        Description: a message in a channel has been updated.
                    </p>
                </div>
                <div class="card-body">                    
                    <div class="flex">
                        <div>
                            <p class="bold">Type:</p>
                            <pre>chat_message_updated</pre>
                        </div>
                        <div class="w-full">
                            <p class="bold">Payload:</p>
                            <pre>{ <span class="ct">ChannelMessage</span> }</pre>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="mb-1">
                   <div class="flex center between mb-1">
                        <h3 class="no-margin ctrl">Channel Message Controller</h3>
                        <div class="badge">Event Type: <span class="type">chat_message_deleted</span></div>
                    </div>
                    <p class="no-margin">
                        Description: a message in a channel has been deleted.
                    </p>
                </div>
                <div class="card-body">                    
                    <div class="flex">
                        <div>
                            <p class="bold">Type:</p>
                            <pre>chat_message_deleted</pre>
                        </div>
                        <div class="w-full">
                            <p class="bold">Payload:</p>
                            <pre>{ channel_uuid: "string" }</pre>
                        </div>
                    </div>
                </div>
            </div>

            <h2 class="title">Client Events</h2>
            
            <script>
                function createCard(controller, eventType, description, payload, example) {
                    const html = \`
                        <div class="card">
                            <div class="mb-1">
                                <div class="flex center between mb-1">
                                    <h3 class="no-margin ctrl"></h3>
                                    <div class="badge">Event Type: <span class="type"></span></div>
                                </div>
                                <p class="no-margin">
                                    Description: <span class="desc"></span>
                                </p>
                            </div>
                            <div class="card-body">                    
                                <div class="flex">
                                    <div>
                                        <p class="bold">Payload:</p>
                                        <pre class="payload"></pre>
                                    </div>
                                    <div class="w-full">
                                        <p class="bold">Example:</p>
                                        <pre class="example"></pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    \`;

                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = html;

                    document.body.appendChild(wrapper);

                    const ctrlElement = wrapper.querySelector('.ctrl');
                    ctrlElement.innerHTML = controller;

                    const typeElement = wrapper.querySelector('.type');
                    typeElement.innerHTML = eventType;

                    const descElement = wrapper.querySelector('.desc');
                    descElement.innerHTML = description;

                    const payloadElement = wrapper.querySelector('.payload');
                    payloadElement.innerHTML = payload;

                    const exampleElement = wrapper.querySelector('.example');
                    exampleElement.innerHTML = example;
                }
createCard(
    'Channel Controller', 
    'join_channel', 
    'Join a channel by sending a string with the name of the channel and a JWT token. Peers connected to a channel will receive messages sent to that channel.', 
\`{
    type: 'join_channel',
    token: 'string',
    channel: 'string'
}\`,
\`{
    type: 'join_channel',
    token: 'eyJhbGciOiJ...',
    channel: 'channel-bb7120d9-2d1b-4f5f-a56b-63a4f5f3ca4b'
}\`
);

createCard(
    'Channel Controller', 
    'leave_channel', 
    'Leave current channel to no longer receive messages from that channel.',
\`{
    type: 'leave_channel'
}\`,
\`{
    type: 'leave_channel'
}\`
);
            </script>
        </body>
        </html>
        `;