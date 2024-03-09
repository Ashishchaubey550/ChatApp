import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "./UserContext.jsx";

export default function RegisterAndLoginForm(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginOrRegister, setIsLoginOrRegister] = useState('register');
    const { setLoggedInUsername, setId } = useContext(UserContext);

    async function handleSubmit(ev) {
        ev.preventDefault();
        let response;
        try {
            if (isLoginOrRegister === 'register') {
                response = await axios.post('/register', { username, password });
            } else {
                response = await axios.post('/login', { username, password });
            }
            const { data } = response;
            setLoggedInUsername(username);
            setId(data.id);
        } catch (error) {
            console.error("Error:", error);
            // Handle error
        }
    }
    

    return (
        <>
            <div className="bg-blue-50 h-screen flex items-center">
                <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
                    <input className="block w-full rounded-sm p-2 mb-2 border" 
                        value={username}
                        onChange={ev => setUsername(ev.target.value)}
                        type="text" placeholder="username" />
                    <input className="block w-full rounded-sm p-2 mb-2 border"
                        value={password}
                        onChange={ev => setPassword(ev.target.value)}
                        type="password" placeholder="password" />
                    <button className="bg-blue-500 text-white block w-full rounded-sm p-2">
                        {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
                    </button>
                    <div className="text-center mt-2">
                        {isLoginOrRegister === 'register' && (
                            <div>
                                Already a Member?
                                <button onClick={() => setIsLoginOrRegister('login')}>
                                    Login Here
                                </button>
                            </div>
                        )}
                        {isLoginOrRegister === 'login' && (
                            <div>
                                Don't Have An Account?
                                <button onClick={() => setIsLoginOrRegister('register')}>
                                    Register
                                </button>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </>
    );
}
