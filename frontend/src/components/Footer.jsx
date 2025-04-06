import {useContext, useState, useCallback } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Github,Linkedin,Instagram,Youtube,Facebook,Mail,MessageCircle,Send} from 'lucide-react';
import axios from 'axios';
import { AppContent } from '../context/AppContext';
import { toast } from 'react-toastify';

export function FooterContainer() {
  
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const { backendUrl } = useContext(AppContent);
    axios.defaults.withCredentials = true;

    // Optimized function to prevent re-renders
    const onSubmitEmail = useCallback(async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${backendUrl}/api/auth/send-message`, { email, message });

            if (data.success) {
                toast.success(data.message);
                setEmail('');
                setMessage('');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }, [email, message, backendUrl]);

    return (
    <></>
    );
}
