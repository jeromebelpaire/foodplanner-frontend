interface MessageProps{
    name: string;
}

function Message({name}: MessageProps) {
    return <h2>Hello from {name}</h2>;
}

export default Message;