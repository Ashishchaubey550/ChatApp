        import { useContext, useEffect, useRef, useState } from "react";
        import Avatar from "./Avatar";
        import Logo from "./Logo";
        import { UserContext } from "./UserContext";
        import _ from 'lodash';

        export default function Chat() {
            const [ws, setWs] = useState(null);
            const [onlinePeople, setOnlinePeople] = useState({});
            const [selectedUserId, setSelectedUserId] = useState(null);
            const {username , id:Id} = useContext(UserContext)
            const [newMessageText , setNewMessageText] = useState('');
            const [messages,setMessages] = useState([]);
            const divUnderMessages = useRef();
            useEffect(() => {
                const ws = new WebSocket('ws://localhost:4000');
                setWs(ws);
                ws.addEventListener('message', handleMessage);
            }, []);

            function showOnlinePeople(peopleArray) {
                const people = {};
                peopleArray.forEach(({ userId, username }) => {
                    people[userId] = username;
                });
                setOnlinePeople(people);
            }

            function handleMessage(ev) {
                const messageData = JSON.parse(ev.data);
                console.log('recied message',messageData.text);
                if ('online' in messageData) {
                    showOnlinePeople(messageData.online);
                }else {
                    setMessages(prev => ([...prev, {...messageData}]));
                }
            }

            function handleUserClick(userId) {
                setSelectedUserId(userId);
            }
            function sendMessage(ev) {
                ev.preventDefault();
                ws.send(JSON.stringify({
                    recipient: selectedUserId,
                    text: newMessageText,
                }));
                setNewMessageText('');
                setMessages(prev => ([...prev, {
                    text: newMessageText,
                    sender:Id,
                    recipient:selectedUserId,
                    id:Date.now(),
                }]));
                
                // console.log('Message sent:', newMessageText);
            }
            useEffect(() => {
                const div = divUnderMessages.current;
                if (div) {
                    div.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            }, [messages]);            
            const onlinePeopleExcludingOurUser = {...onlinePeople};
            delete onlinePeopleExcludingOurUser[Id];
            const messageWithoutDupes = _.uniqBy(messages,'id');

            return (
                <div className="flex h-screen">
                    <div className="bg-white w-1/3 pl-4 pt-4">
                        <Logo/>
                        {/* {username} */}
                        {Object.keys(onlinePeopleExcludingOurUser)
                        .map(userId => (
                            <div key={userId} onClick={() => handleUserClick(userId)} className={"border-b border-gray-100  flex items-center gap-2 cursor-pointer py-4" + (userId === selectedUserId ? ' bg-blue-50' : '')}>
                                {userId === selectedUserId && (
                                    <div className=" w-1 bg-blue-500 h-12"></div>
                                )}
                                <div className=" flex gap-2 py-2 pl-2 items-center">
                                <Avatar username={onlinePeople[userId]} userId={userId} />
                                <span className="text-gray-800">{onlinePeople[userId]}</span>
                                </div>
                                
                            </div>
                        ))}
                    </div>
                    <div className="bg-blue-100 w-2/3 p-2 flex flex-col">
                        <div className="flex-grow">{!selectedUserId && (
                            <div className=" h-full flex-grow flex  items-center justify-center"><div>&larr; Selected Person From sidebar</div></div>
                        )}
                        {!!selectedUserId && (
                                                        <div className="relative h-full">
                            
                            <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2" >
                                    {messageWithoutDupes.map((message) => (
                                    <div className={(message.sender === Id ? 'text-right' : 'text-left')}>
                                    <div className={"inline-block p-2 m-2 rounded-sm text-sm" + (message.sender === Id ? ' bg-blue-500 text-white' : ' bg-white text-gray-500')}>
                                    sender: {message.sender}<br/>
                                    my id: {Id}<br/>
                                    {message.text}
                                </div>
                            </div>
                        // </div>
        ))}
        <div ref={divUnderMessages}>
        </div>
    </div>
    </div>
    )}
                        </div>
                        {!!selectedUserId && (
                                            <form className="flex gap-2" onSubmit={sendMessage}>
                                            <input type="text" 
                                            value={newMessageText}
                                            onChange={ev=>setNewMessageText(ev.target.value)}
                                            className="bg-white p-2 border flex-grow rounded-sm"
                                            placeholder="Type Your Message Here" />
                                            <button type="submit" className="bg-blue-500 text-white p-2 rounded-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                                </svg>
                                            </button>
                                        </form>
                        )}
                    </div>
                </div>
            );
        }
