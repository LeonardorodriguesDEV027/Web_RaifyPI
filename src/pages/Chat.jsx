import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const initials = (name) =>
  String(name || 'RAIFY')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase();

const messageTime = (value) => {
  const date =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : value?.seconds
        ? new Date(value.seconds * 1000)
        : null;
  return date
    ? date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '';
};

export default function Chat() {
  const { user } = useAuth();
  const isAgronomo = user?.tipoUsuario === 'agronomo';
  const canChatDirectly = ['produtor', 'agronomo'].includes(user?.tipoUsuario);
  const [channel, setChannel] = useState(isAgronomo ? 'direto' : 'admin');
  const [msg, setMsg] = useState('');
  const [adminMessages, setAdminMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    setChannel(isAgronomo ? 'direto' : 'admin');
  }, [isAgronomo]);

  useEffect(() => {
    if (!user?.uid) return undefined;
    try {
      return api.onMessages(setAdminMessages, (e) => setError(e.message));
    } catch (e) {
      setError(e.message);
      return undefined;
    }
  }, [user?.uid]);

  useEffect(() => {
    if (channel !== 'direto' || !canChatDirectly) return undefined;
    let active = true;
    setContactsLoading(true);
    setError('');
    api
      .chatContacts()
      .then((items) => {
        if (active) setContacts(items);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setContactsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [channel, canChatDirectly, user?.uid]);

  const conversationId = useMemo(
    () => (selected && user?.uid ? [selected.uid || selected.id, user.uid].sort().join('_') : ''),
    [selected, user?.uid]
  );

  useEffect(() => {
    setDirectMessages([]);
    if (channel !== 'direto' || !conversationId) return undefined;
    try {
      return api.onDirectMessages(
        conversationId,
        setDirectMessages,
        (e) => setError(e.message)
      );
    } catch (e) {
      setError(e.message);
      return undefined;
    }
  }, [channel, conversationId]);

  const visibleContacts = useMemo(() => {
    const term = normalize(contactSearch.trim());
    if (!term) return contacts;
    return contacts.filter((contact) =>
      normalize(`${contact.nomeCompleto} ${(contact.propriedades || []).join(' ')}`).includes(term)
    );
  }, [contacts, contactSearch]);

  const messages = channel === 'direto' ? directMessages : adminMessages;
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = msg.trim();
    if (!text || sending) return;
    setSending(true);
    setMsg('');
    setError('');
    try {
      if (channel === 'direto') {
        if (!selected) throw new Error('Selecione um contato para iniciar a conversa.');
        await api.sendDirectMessage(selected.uid || selected.id, text);
      } else {
        await api.sendMessage(text);
      }
    } catch (e) {
      setMsg(text);
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  const directTitle = isAgronomo ? 'Agricultores' : 'Agrônomos';
  const contactLabel = selected?.nomeCompleto || directTitle;
  const contactSubtitle = isAgronomo
    ? (selected?.propriedades || []).join(' • ') || 'Agricultor'
    : 'Agrônomo aprovado';

  function renderConversation(isDirect) {
    return (
      <>
        <div className="chat-person">
          <div className="avatar-small">{initials(isDirect ? contactLabel : 'Administração RAIFY')}</div>
          <div>
            <b>{isDirect ? contactLabel : 'Administração RAIFY'}</b>
            <span>{isDirect ? contactSubtitle : 'Conversa privada com a equipe administrativa.'}</span>
          </div>
        </div>
        <div className="chat-messages">
          {!messages.length && <p className="ag-muted">Nenhuma mensagem nesta conversa.</p>}
          {messages.map((message) => {
            const mine = isDirect
              ? message.remetenteUid === user?.uid
              : message.autor === 'usuario';
            return (
              <div className={`message ${mine ? 'mine' : ''}`} key={message.id}>
                {isDirect && !mine && <small className="d-block opacity-75 mb-1">{message.autorNome}</small>}
                {message.texto}
                <small className="d-block opacity-75 mt-1">{messageTime(message.criadoEm)}</small>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        <div className="chat-input">
          <input
            placeholder="Digite uma mensagem..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            disabled={isDirect && !selected}
          />
          <button onClick={send} disabled={sending || (isDirect && !selected)} aria-label="Enviar mensagem">
            <i className="bi bi-send-fill" />
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Chat"
        subtitle="Converse com a administração e, quando necessário, com agricultores ou agrônomos."
      />
      {canChatDirectly && (
        <div className="tabs-raify ag-tabs">
          <button className={channel === 'direto' ? 'active' : ''} onClick={() => setChannel('direto')}>
            {directTitle}
          </button>
          <button className={channel === 'admin' ? 'active' : ''} onClick={() => setChannel('admin')}>
            Administração
          </button>
        </div>
      )}
      {error && <div className="alert alert-warning">{error}</div>}

      {channel === 'direto' && canChatDirectly ? (
        <div className="support-layout ag-direct-chat">
          <aside className="raify-card p-3 ag-chat-contacts">
            <h3>{directTitle}</h3>
            {isAgronomo && (
              <p className="ag-muted">Pesquise agricultores pelo nome ou pelo nome da propriedade.</p>
            )}
            <input
              className="form-control mb-2"
              type="search"
              placeholder={isAgronomo ? 'Buscar agricultor ou propriedade...' : 'Buscar agrônomo...'}
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
            />
            {contactsLoading && <p className="ag-muted mt-3">Carregando contatos...</p>}
            {!contactsLoading && !visibleContacts.length && (
              <p className="ag-muted mt-3">
                {contactSearch
                  ? 'Nenhum contato corresponde à busca.'
                  : 'Nenhum contato ativo disponível.'}
              </p>
            )}
            {visibleContacts.map((contact) => (
              <button
                type="button"
                key={contact.uid || contact.id}
                className={`ag-chat-contact ${selected?.uid === contact.uid ? 'active' : ''}`}
                onClick={() => {
                  setSelected(contact);
                  setError('');
                }}
              >
                <span className="avatar-small">{initials(contact.nomeCompleto)}</span>
                <span className="ag-chat-contact-text">
                  <b>{contact.nomeCompleto}</b>
                  {isAgronomo && (contact.propriedades || []).length > 0 && (
                    <small>{contact.propriedades.join(' • ')}</small>
                  )}
                  {!isAgronomo && <small>Agrônomo</small>}
                </span>
              </button>
            ))}
          </aside>
          <div className="raify-card chat-box">
            {selected ? (
              renderConversation(true)
            ) : (
              <p className="ag-muted p-4 mb-0">Selecione um contato para abrir a conversa.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="raify-card chat-box">{renderConversation(false)}</div>
      )}
    </>
  );
}
