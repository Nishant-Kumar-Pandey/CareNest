'use client';

import { useState, useEffect, useRef } from 'react';
import { socket } from '../lib/socket';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function ChatDrawer({ isOpen, onClose, bookingId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);


  useEffect(() => {
    if (isOpen && bookingId) {
      fetchMessages();
      
      // Join the specific booking room
      socket.emit('join_booking_room', bookingId);

      const handleReceiveMessage = (message) => {
        setMessages((prev) => [...prev, message]);
      };

      socket.on('receive_message', handleReceiveMessage);

      return () => {
        socket.off('receive_message', handleReceiveMessage);
      };
    }
  }, [isOpen, bookingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.chat.getMessages(bookingId);
      setMessages(res.data);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !fileInputRef.current?.files[0]) return;

    const isMedia = fileInputRef.current?.files?.length > 0;
    
    try {
      if (isMedia) {
        const body = new FormData();
        body.append('text', newMessage.trim());
        Array.from(fileInputRef.current.files).forEach(file => {
          body.append('files', file);
        });
        await api.chat.sendMessage(bookingId, body);
        fileInputRef.current.value = '';
      } else {
        await api.chat.sendMessage(bookingId, { text: newMessage.trim() });
      }
      setNewMessage('');
    } catch (err) {
      toast.error('Failed to send message');
    }
  };


  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '400px',
      background: 'var(--warm-white)', boxShadow: 'var(--shadow-2xl)', zIndex: 1100,
      display: 'flex', flexDirection: 'column',
      animation: 'slideInRight 0.3s var(--ease-smooth)',
      borderLeft: '1px solid var(--border)'
    }}>
      {/* Header */}
      <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontFamily: 'var(--font-serif)' }}>Care Coordination</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Secure & Archived</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', background: 'var(--cream-50)' }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', opacity: 0.5 }}>
            <p>Start a conversation regarding this care session.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender?._id === currentUser._id || msg.sender === currentUser._id;
            return (
              <div key={msg._id || idx} style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: isMe ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                  background: isMe ? 'var(--primary)' : 'white',
                  color: isMe ? 'white' : 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: '0.9375rem',
                  lineHeight: 1.4
                }}>
                  {msg.text}
                  {msg.attachments?.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {msg.attachments.map((att, i) => (
                        <a 
                          key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'block', maxWidth: '100%' }}
                        >
                          {att.fileType === 'image' ? (
                            <img src={att.url} alt="attachment" style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: 'var(--shadow-xs)' }} />
                          ) : (
                            <div style={{ padding: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              📄 Document
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border)', background: 'white' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              width: 40, height: 40, borderRadius: '50%', background: 'var(--cream-100)', 
              border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' 
            }}
          >
            📎
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            multiple 
            accept="image/*,.pdf"
            onChange={() => {
              if (fileInputRef.current?.files?.length > 0) {
                toast.success(`${fileInputRef.current.files.length} file(s) selected`);
              }
            }}
          />
          <input 
            type="text" 
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-full)',
              border: '2px solid var(--cream-200)', background: 'var(--cream-50)',
              outline: 'none', transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--cream-200)'}
          />
          <button type="submit" style={{
            width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)',
            color: 'white', border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem'
          }}>
            ✈
          </button>
        </div>
      </form>


      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
