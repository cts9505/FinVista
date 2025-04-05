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
        <footer className="w-full bg-white py-12 bottom-0">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Me Column */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-4">About Me</h3>
            <p className="text-gray-700">
              Hi, I'm Chaitanya Shinde, a second-year Computer Engineering student at PICT, Pune, with a CGPA of 9.91. 
              I have a strong passion for full-stack development, specializing in:
              <br />
              <strong>Frontend:</strong> HTML, CSS, JavaScript, React, Next.js
              <br />
              <strong>Backend:</strong> Node.js, PHP, Python, CPP, C
              <br />
              <strong>Database:</strong> MySQL, MongoDB. 
              <br />
              I love solving complex coding challenges, participating in hackathons, and building impactful projects.
              <br />
              Always open to collaborations, discussions, and new opportunities. Let's connect! 🚀
            </p>
          </div>

          {/* Social Media Column */}
          <div className="space-y-4 md:pl-16">
            <h3 className="text-2xl font-bold mb-4">Social Media</h3>
            <div className="space-y-3">
              <a href="https://github.com/cts9505" className="flex items-center text-gray-700 hover:text-black transition">
                <Github className="mr-3" /> GitHub
              </a>
              <a href="https://www.linkedin.com/in/chaitanya-shinde-computer/" className="flex items-center text-gray-700 hover:text-black transition">
                <Linkedin className="mr-3" /> LinkedIn
              </a>
              <a href="https://www.instagram.com/_chaitanya_.9505/" className="flex items-center text-gray-700 hover:text-black transition">
                <Instagram className="mr-3" /> Instagram
              </a>
              <a href="https://www.youtube.com/@chaitanyashindecomputer" className="flex items-center text-gray-700 hover:text-black transition">
                <Youtube className="mr-3" /> YouTube
              </a>
              <a href="https://www.facebook.com/profile.php?id=61551709142982" className="flex items-center text-gray-700 hover:text-black transition">
                <Facebook className="mr-3" /> Facebook
              </a>
            </div>
          </div>

          {/* Contact Me Column */}
          <div className="space-y-4 md:pl-8">
            <h3 className="text-2xl font-bold mb-4">Contact Me</h3>
            <form onSubmit={onSubmitEmail} className="space-y-4">
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-gray-200">
                <Mail className="text-gray-600" />
                <input
                  className="bg-transparent outline-none text-black w-full"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  type="email"
                  placeholder="Enter your Email"
                  required
                />
              </div>
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-gray-200 h-20">
                <MessageCircle className="text-gray-600" />
                <input
                  className="bg-transparent outline-none text-black w-full"
                  onChange={(e) => setMessage(e.target.value)}
                  value={message}
                  type="text"
                  placeholder="Enter your Message"
                  required
                />
              </div>
              <button className='w-full py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full hover:opacity-90 transition' >
                Send Message <Send className='ml-2 inline' />
              </button>
            </form>
          </div>
        </div>
      </div>
    </footer>
    );
}
