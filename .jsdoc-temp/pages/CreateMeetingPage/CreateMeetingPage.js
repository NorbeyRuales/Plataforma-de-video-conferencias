import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**





/**





/**

 * Dashboard page to create or join a meeting.

 * GUI-only for now. Later this page should connect to backend / WebRTC.

 */
import { useEffect, useState } from 'react';
import { Hash, PencilLine } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import './CreateMeetingPage.scss';
import { useToast } from '../../components/layout/ToastProvider';
import { createMeeting, getMeeting, listMeetings, updateMeeting, deleteMeetingApi, } from '../../services/api';
import { AUTH_TOKEN_EVENT, getAuthToken } from '../../services/authToken';
/**

 * React component that acts as the meetings dashboard.

 * Lets the user simulate creating or joining a meeting and shows demo toasts.

 *

 * @returns {JSX.Element} Layout with create/join meeting forms and helper text.

 */
export function CreateMeetingPage() {
    const { showToast } = useToast();
    const today = new Date().toISOString().split('T')[0];
    const [authTokenState, setAuthTokenState] = useState(() => getAuthToken() ?? '');
    const [meetingName, setMeetingName] = useState('');
    const [meetingId, setMeetingId] = useState('');
    const [date, setDate] = useState(today);
    const [time, setTime] = useState('09:00');
    const [duration, setDuration] = useState(30);
    const [description, setDescription] = useState('');
    const [createdMeeting, setCreatedMeeting] = useState(null);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [meetings, setMeetings] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [createErrorMessage, setCreateErrorMessage] = useState(null);
    const [joinErrorMessage, setJoinErrorMessage] = useState(null);
    const isCreateValid = meetingName.trim().length > 0 &&
        date.trim().length > 0 &&
        time.trim().length > 0 &&
        Number(duration) > 0;
    const isJoinValid = meetingId.trim().length > 0;
    const isAuthenticated = Boolean(authTokenState.trim());
    const loadMeetings = async () => {
        if (!isAuthenticated)
            return;
        setIsLoading(true);
        try {
            const data = await listMeetings();
            setMeetings(data);
        }
        catch (error) {
            showToast(error.message ?? 'No se pudieron cargar las reuniones.', 'error');
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        if (authTokenState.trim()) {
            void loadMeetings();
        }
        else {
            setMeetings([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authTokenState]);
    useEffect(() => {
        const handleAuthChange = () => setAuthTokenState(getAuthToken() ?? '');
        window.addEventListener('storage', handleAuthChange);
        window.addEventListener(AUTH_TOKEN_EVENT, handleAuthChange);
        return () => {
            window.removeEventListener('storage', handleAuthChange);
            window.removeEventListener(AUTH_TOKEN_EVENT, handleAuthChange);
        };
    }, []);
    const resetForm = (options) => {
        const keepMeetingId = Boolean(options?.preserveMeetingId);
        setMeetingName('');
        setDate(today);
        setTime('09:00');
        setDuration(30);
        setDescription('');
        if (!keepMeetingId) {
            setMeetingId('');
        }
        setSelectedMeeting(null);
        setCreateErrorMessage(null);
    };
    const handleCreateMeeting = async (event) => {
        event.preventDefault();
        if (!isAuthenticated) {
            showToast('Inicia sesion para crear reuniones.', 'error');
            return;
        }
        if (!isCreateValid || isCreating) {
            setCreateErrorMessage('Completa nombre, fecha, hora y duracion (minimo 5 minutos) antes de crear.');
            return;
        }
        setIsCreating(true);
        try {
            const payload = {
                title: meetingName.trim(),
                date,
                time,
                duration: Number(duration),
                description: description.trim() || undefined,
            };
            if (editingId) {
                await updateMeeting(editingId, payload);
                showToast('Reunion actualizada correctamente.', 'success');
                setEditingId(null);
                setCreatedMeeting(null);
                resetForm();
            }
            else {
                const response = await createMeeting(payload);
                setCreatedMeeting(response.meeting);
                setMeetingId(response.meeting.id);
                showToast('Reunion creada correctamente.', 'success');
                resetForm({ preserveMeetingId: true });
            }
            setCreateErrorMessage(null);
            await loadMeetings();
        }
        catch (error) {
            const message = error?.message ??
                'No se pudo guardar la Reunion. Revisa los datos e intentalo de nuevo.';
            setCreateErrorMessage('Revisa los campos y vuelve a intentar.');
            showToast(message, 'error');
        }
        finally {
            setIsCreating(false);
        }
    };
    const handleEditMeeting = (meeting) => {
        setEditingId(meeting.id);
        setMeetingName(meeting.title);
        setDate(meeting.date);
        setTime(meeting.time);
        setDuration(meeting.duration);
        setDescription(meeting.description ?? '');
        showToast('Editando Reunión. Guarda los cambios.', 'info');
    };
    const handleDeleteMeeting = async (id) => {
        if (!isAuthenticated) {
            showToast('Inicia sesión para eliminar reuniones.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await deleteMeetingApi(id);
            showToast('Reunión eliminada.', 'success');
            if (editingId === id) {
                setEditingId(null);
                setCreatedMeeting(null);
            }
            await loadMeetings();
        }
        catch (error) {
            showToast(error.message ?? 'No se pudo eliminar la Reunión.', 'error');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleLookupMeeting = async (event) => {
        event.preventDefault();
        if (!isAuthenticated) {
            showToast('Inicia sesion para consultar reuniones.', 'error');
            return;
        }
        if (!isJoinValid) {
            setJoinErrorMessage('Ingresa el ID de la reunion para continuar.');
            return;
        }
        const trimmedId = meetingId.trim();
        setIsLoading(true);
        try {
            const meeting = await getMeeting(trimmedId);
            setSelectedMeeting(meeting);
            setJoinErrorMessage(null);
            showToast('Reunion encontrada.', 'success');
            const targetUrl = `${window.location.origin}/meeting/${encodeURIComponent(trimmedId)}`;
            window.open(targetUrl, '_blank', 'noreferrer');
        }
        catch (error) {
            setSelectedMeeting(null);
            const message = error?.message ??
                'No se pudo encontrar la reunion. Verifica el ID (formato abc-defg-hij) e intentalo de nuevo.';
            setJoinErrorMessage('Verifica que el ID tenga el formato abc-defg-hij y copialo completo.');
            showToast(message, 'error');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "dashboard-wrapper", children: _jsxs("div", { className: "container", children: [_jsxs("section", { className: "dashboard-card meeting-card", "aria-labelledby": "meeting-dashboard-title", children: [_jsx("header", { className: "dashboard-main-header meeting-header", children: _jsxs("div", { children: [_jsx("h1", { id: "meeting-dashboard-title", children: "Bienvenido, Usuario" }), _jsx("p", { children: "Inicia o \u00FAnete a una videoconferencia." })] }) }), _jsxs("div", { className: "form-group", style: { marginBottom: '20px' }, children: [_jsx("span", { className: `badge ${isAuthenticated ? 'badge-success' : 'badge-warning'}`, "aria-label": "Estado de autenticacion", children: isAuthenticated ? 'Sesión activa' : 'Sin sesi?n' }), !isAuthenticated && (_jsx("p", { className: "field-help", children: "Inicia sesi?n para crear, listar o consultar reuniones protegidas." }))] }), _jsxs("div", { className: "meeting-actions-row", children: [_jsxs("section", { className: "meeting-column", "aria-labelledby": "create-meeting-title", children: [_jsx("h2", { id: "create-meeting-title", className: "meeting-column-title", children: "+ Crear nueva reuni\u00F3n" }), _jsx("p", { className: "meeting-column-subtitle", children: "Inicia una reuni\u00F3n instant\u00E1nea e invita participantes." }), _jsxs("form", { className: "meeting-form", onSubmit: handleCreateMeeting, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "meetingName", children: "Nombre de la reunion" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: _jsx(PencilLine, { size: 16 }) }), _jsx("input", { className: "form-input", id: "meetingName", name: "meetingName", type: "text", placeholder: "ej. Reunion de equipo", required: true, value: meetingName, "aria-describedby": createErrorMessage ? 'create-meeting-tooltip' : undefined, "data-tooltip-id": "create-meeting-tooltip", onChange: (event) => {
                                                                        setMeetingName(event.target.value);
                                                                        setCreateErrorMessage(null);
                                                                    }, disabled: !isAuthenticated || isCreating })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "date", children: "Fecha" }), _jsx("input", { className: "form-input", id: "date", name: "date", type: "date", value: date, onChange: (event) => setDate(event.target.value), disabled: !isAuthenticated || isCreating, required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "time", children: "Hora" }), _jsx("input", { className: "form-input", id: "time", name: "time", type: "time", value: time, onChange: (event) => setTime(event.target.value), disabled: !isAuthenticated || isCreating, required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "duration", children: "Duracion (minutos)" }), _jsx("input", { className: "form-input", id: "duration", name: "duration", type: "number", min: 5, max: 480, step: 5, value: duration, onChange: (event) => setDuration(Number(event.target.value)), disabled: !isAuthenticated || isCreating, required: true }), _jsx("p", { className: "field-help", children: "Minimo 5 minutos y maximo 480." })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "description", children: "Descripcion (opcional)" }), _jsx("textarea", { className: "form-textarea", id: "description", name: "description", rows: 3, placeholder: "Agenda, temas, invitados...", value: description, onChange: (event) => setDescription(event.target.value), disabled: !isAuthenticated || isCreating })] }), _jsx("button", { type: "submit", className: "btn btn-dark meeting-primary", disabled: !isAuthenticated || !isCreateValid || isCreating, children: isCreating ? 'Creando...' : 'Crear reunion' }), _jsx(Tooltip, { id: "create-meeting-tooltip", place: "bottom", offset: 6, className: "field-error-tooltip field-error-tooltip--error", openOnClick: false, isOpen: Boolean(createErrorMessage), content: createErrorMessage ?? undefined, noArrow: true }), !isAuthenticated && (_jsx("p", { className: "form-hint form-hint-error", children: "Inicia sesi\u00F3n para crear reuniones." })), createdMeeting && (_jsxs("p", { className: "form-hint form-hint-success", children: ["Reunion creada. ID: ", createdMeeting.id] }))] })] }), _jsxs("section", { className: "meeting-column", "aria-labelledby": "join-meeting-title", children: [_jsx("h2", { id: "join-meeting-title", className: "meeting-column-title", children: "Unirse a reuni\u00F3n" }), _jsx("p", { className: "meeting-column-subtitle", children: "Ingresa un ID de reuni\u00F3n para unirte a una sesi\u00F3n existente." }), _jsxs("form", { className: "meeting-form", onSubmit: handleLookupMeeting, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "meetingId", children: "ID de la reunion" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: _jsx(Hash, { size: 16 }) }), _jsx("input", { className: "form-input", id: "meetingId", name: "meetingId", type: "text", placeholder: "ej. abc-defg-hij", required: true, value: meetingId, "aria-describedby": joinErrorMessage ? 'join-meeting-tooltip' : undefined, "data-tooltip-id": "join-meeting-tooltip", onChange: (event) => {
                                                                        setMeetingId(event.target.value);
                                                                        setJoinErrorMessage(null);
                                                                    }, disabled: !isAuthenticated || isLoading })] }), _jsx("p", { className: "field-help", children: "Formato esperado: tres bloques con guiones (abc-defg-hij)." })] }), _jsx("button", { type: "submit", className: "btn meeting-secondary", disabled: !isAuthenticated || !isJoinValid || isLoading, children: isLoading ? 'Buscando...' : 'Unirse a reunion' }), _jsx(Tooltip, { id: "join-meeting-tooltip", place: "bottom", offset: 6, className: "field-error-tooltip field-error-tooltip--error", openOnClick: false, isOpen: Boolean(joinErrorMessage), content: joinErrorMessage ?? undefined, noArrow: true }), selectedMeeting && (_jsxs("p", { className: "form-hint form-hint-success", children: ["Reunion encontrada: ", selectedMeeting.title, " (", selectedMeeting.id, ")"] })), !isAuthenticated && (_jsx("p", { className: "form-hint form-hint-error", children: "Inicia sesi\u00F3n para consultar reuniones." }))] })] })] }), _jsxs("section", { className: "quick-guide", "aria-label": "Gu\u00EDa r\u00E1pida para usar las reuniones", children: [_jsx("h2", { className: "quick-guide-title", children: "Gu\u00EDa r\u00E1pida" }), _jsxs("div", { className: "quick-guide-steps", children: [_jsxs("article", { className: "quick-step", children: [_jsx("span", { className: "quick-step-badge", children: "1" }), _jsx("h3", { children: "Crear o unirse" }), _jsx("p", { children: "Inicia una nueva reuni\u00F3n o \u00FAnete usando un ID de reuni\u00F3n compartido contigo." })] }), _jsxs("article", { className: "quick-step", children: [_jsx("span", { className: "quick-step-badge", children: "2" }), _jsx("h3", { children: "Compartir ID de reuni\u00F3n" }), _jsx("p", { children: "Comparte el ID de reuni\u00F3n con los participantes para que puedan unirse." })] }), _jsxs("article", { className: "quick-step", children: [_jsx("span", { className: "quick-step-badge", children: "3" }), _jsx("h3", { children: "Comenzar a colaborar" }), _jsx("p", { children: "Usa video, audio y chat para comunicarte y trabajar con tu equipo." })] })] })] })] }), isAuthenticated ? (_jsxs("section", { className: "meeting-column", "aria-label": "Tus reuniones", children: [_jsx("h2", { className: "meeting-column-title", children: "Tus reuniones" }), isLoading ? (_jsx("p", { children: "Cargando reuniones..." })) : meetings.length === 0 ? (_jsx("p", { children: "Todavia no has creado reuniones." })) : (_jsx("ul", { className: "meeting-list-items", children: meetings.map((meeting) => (_jsx("li", { className: "meeting-list-item", children: _jsxs("div", { className: "meeting-list-main", children: [_jsxs("div", { children: [_jsx("strong", { children: meeting.title }), " - ", meeting.date, " ", meeting.time, " (ID: ", meeting.id, ")", editingId === meeting.id && (_jsx("span", { className: "badge badge-info", style: { marginLeft: '8px' }, children: "Editando" }))] }), _jsxs("div", { className: "meeting-list-actions", children: [_jsx("button", { type: "button", className: "btn btn-small", onClick: () => handleEditMeeting(meeting), disabled: isLoading, children: "Editar" }), _jsx("button", { type: "button", className: "btn btn-danger btn-small", onClick: () => handleDeleteMeeting(meeting.id), disabled: isLoading, children: "Eliminar" })] })] }) }, meeting.id))) }))] })) : (_jsx("p", { className: "form-hint form-hint-error", children: "Inicia sesin para listar tus reuniones." }))] }) }));
}
