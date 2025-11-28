import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Confetti from 'react-confetti';
import { 
  Container, Typography, Box, TextField, Button, 
  Card, CardContent, IconButton, Grid, 
  Paper, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, 
  DialogContentText, Chip, Fade, MenuItem, Select, FormControl, InputLabel, 
  Snackbar, Alert, AppBar, Toolbar, Divider, Avatar, InputAdornment
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// --- ICONOS ---
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import EditIcon from '@mui/icons-material/Edit';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SearchIcon from '@mui/icons-material/Search';
import ShareIcon from '@mui/icons-material/Share';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import HomeIcon from '@mui/icons-material/Home';
import CelebrationIcon from '@mui/icons-material/Celebration';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EventIcon from '@mui/icons-material/Event';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import PersonIcon from '@mui/icons-material/Person';

const api = axios.create({ baseURL: 'http://localhost:5000' });

// CREDENCIALES MAESTRAS
const MASTER_USER = "admin";
const MASTER_PASS = "1234";

function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const eventoIdUrl = queryParams.get('id');
  
  const [modoOscuro, setModoOscuro] = useState(() => localStorage.getItem('tema') === 'dark');
  const [isMasterAdmin, setIsMasterAdmin] = useState(() => localStorage.getItem('masterSession') === 'true');

  const theme = React.useMemo(() => createTheme({
    palette: {
      mode: modoOscuro ? 'dark' : 'light',
      primary: { main: '#37474F' }, 
      secondary: { main: '#26A69A' }, 
      background: { 
        default: modoOscuro ? '#121212' : '#F8F9FA', 
        paper: modoOscuro ? '#1E1E1E' : '#FFFFFF' 
      },
      text: {
        primary: modoOscuro ? '#ECEFF1' : '#2D3436',
        secondary: modoOscuro ? '#B0BEC5' : '#636E72'
      }
    },
    typography: { 
      fontFamily: '"Poppins", "Inter", sans-serif',
      h3: { fontWeight: 700, letterSpacing: '-1px' },
      h4: { fontWeight: 700, letterSpacing: '-0.5px' },
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600, borderRadius: 12 }
    },
    shape: { borderRadius: 16 },
    components: { 
      MuiCard: { 
        styleOverrides: { 
          root: { 
            borderRadius: 24, 
            transition: 'all 0.3s ease-in-out',
            height: '100%' // Para que todas las tarjetas tengan altura uniforme si se desea
          } 
        } 
      },
      MuiButton: { styleOverrides: { root: { padding: '8px 20px', boxShadow: 'none' } } },
      MuiTextField: { styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 12 } } } },
      MuiSelect: { styleOverrides: { root: { borderRadius: 12 } } }
    }
  }), [modoOscuro]);

  const handleMasterLogin = (u, p) => {
      if(u === MASTER_USER && p === MASTER_PASS) {
          setIsMasterAdmin(true);
          localStorage.setItem('masterSession', 'true');
          return true;
      }
      return false;
  };

  const handleLogout = () => {
      setIsMasterAdmin(false);
      localStorage.removeItem('masterSession');
  };

  return (
      <ThemeProvider theme={theme}>
          {eventoIdUrl ? (
              <VistaEvento eventoId={eventoIdUrl} modoOscuro={modoOscuro} setModoOscuro={setModoOscuro} />
          ) : (
              <VistaDashboard 
                isMasterAdmin={isMasterAdmin} 
                onLogin={handleMasterLogin} 
                onLogout={handleLogout}
                modoOscuro={modoOscuro} 
                setModoOscuro={setModoOscuro} 
              />
          )}
      </ThemeProvider>
  );
}

// ==========================================
// VISTA 1: DASHBOARD
// ==========================================
function VistaDashboard({ isMasterAdmin, onLogin, onLogout, modoOscuro, setModoOscuro }) {
    const [eventos, setEventos] = useState([]);
    const [nuevoEvento, setNuevoEvento] = useState({ nombre: '', fecha: '', password: '1234' });
    const [listaInicial, setListaInicial] = useState([]);
    const [itemTemp, setItemTemp] = useState({ nombre: '', objetivo: '', unidad: 'Unidades' });

    const [modalLoginOpen, setModalLoginOpen] = useState(false);
    const [loginData, setLoginData] = useState({ user: '', pass: '' });

    useEffect(() => {
        api.get('/eventos').then(res => setEventos(res.data)).catch(e => console.error(e));
    }, []);

    const agregarItemInicial = () => {
        if(!itemTemp.nombre || !itemTemp.objetivo || itemTemp.objetivo <= 0) return alert("Verifica los datos del item");
        setListaInicial([...listaInicial, itemTemp]);
        setItemTemp({ nombre: '', objetivo: '', unidad: 'Unidades' });
    };

    const eliminarItemInicial = (index) => {
        const nuevaLista = [...listaInicial];
        nuevaLista.splice(index, 1);
        setListaInicial(nuevaLista);
    };

    const crearEventoCompleto = async (e) => {
        e.preventDefault();
        if(!nuevoEvento.nombre || !nuevoEvento.fecha) return alert("Por favor completa: Nombre y Fecha.");
        
        try {
            const resEvento = await api.post('/crear-evento', { nombre: nuevoEvento.nombre, password: nuevoEvento.password });
            const nuevoId = resEvento.data.id;
            await api.put(`/evento/${nuevoId}`, { fecha: nuevoEvento.fecha });
            
            if (listaInicial.length > 0) {
                const promesas = listaInicial.map(meta => 
                    api.post(`/metas/${nuevoId}`, { ...meta, categoria: 'Comida', prioridad: 'Normal' })
                );
                await Promise.all(promesas);
            }
            window.location.href = `/?id=${nuevoId}`;
        } catch(e) { alert("Error al crear. Verifica la conexión."); }
    };

    const borrarEvento = async (e, id) => {
        e.stopPropagation();
        if(window.confirm("⚠️ ¿Eliminar evento?")) {
            await api.delete(`/evento/${id}`);
            const res = await api.get('/eventos');
            setEventos(res.data);
        }
    };

    const submitLogin = () => {
        if(onLogin(loginData.user, loginData.pass)) setModalLoginOpen(false);
        else alert("Credenciales incorrectas");
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8 }}>
            <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Toolbar>
                    <RestaurantMenuIcon sx={{ mr: 1.5, color: 'secondary.main', fontSize: 28 }} />
                    <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 800, color: 'text.primary', letterSpacing: -1 }}>
                        Event<Box component="span" sx={{ color: 'secondary.main' }}>Bite</Box>
                    </Typography>
                    
                    <IconButton onClick={()=>setModoOscuro(!modoOscuro)} sx={{ mr: 1 }}>
                        {modoOscuro ? <LightModeIcon/> : <DarkModeIcon/>}
                    </IconButton>
                    
                    {isMasterAdmin ? (
                        <Button variant="outlined" color="error" startIcon={<ExitToAppIcon/>} onClick={onLogout}>Salir</Button>
                    ) : (
                        <Button variant="contained" color="primary" startIcon={<AdminPanelSettingsIcon/>} onClick={()=>setModalLoginOpen(true)} sx={{ borderRadius: 10 }}>Soy Admin</Button>
                    )}
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 6 }}>
                <Grid container spacing={6}>
                    {/* --- CREAR EVENTO (ADMIN) --- */}
                    {isMasterAdmin && (
                        <Grid item xs={12} md={5}>
                            <Fade in>
                                <Paper sx={{ p: 4, borderRadius: 6, position: 'sticky', top: 100, bgcolor: 'primary.main', color: 'white', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                                    <Box display="flex" alignItems="center" gap={1} mb={3}>
                                        <CelebrationIcon sx={{ color: 'secondary.main', fontSize: 30 }}/> 
                                        <Typography variant="h5" fontWeight={700}>Nuevo Evento</Typography>
                                    </Box>

                                    <Box display="flex" flexDirection="column" gap={2}>
                                        <TextField 
                                            fullWidth placeholder="Nombre del Evento" variant="filled" 
                                            value={nuevoEvento.nombre} onChange={e=>setNuevoEvento({...nuevoEvento, nombre:e.target.value})}
                                            InputProps={{ disableUnderline: true }} sx={{ bgcolor: 'white', borderRadius: 3 }}
                                        />
                                        <TextField 
                                            fullWidth type="date" label="Fecha del Evento" variant="filled" 
                                            value={nuevoEvento.fecha} onChange={e=>setNuevoEvento({...nuevoEvento, fecha:e.target.value})}
                                            InputLabelProps={{ shrink: true }}
                                            InputProps={{ disableUnderline: true }} sx={{ bgcolor: 'white', borderRadius: 3 }}
                                        />
                                    </Box>
                                    
                                    <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 3 }}>
                                        <Chip label="Lista Rápida (Opcional)" size="small" sx={{bgcolor:'rgba(255,255,255,0.2)', color:'white'}}/>
                                    </Divider>

                                    {/* --- SELECTOR DE UNIDADES (BLANCO FIJO) --- */}
                                    <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', p: 2, borderRadius: 3, mb: 2 }}>
                                        <Grid container spacing={1}>
                                            <Grid item xs={12}>
                                                <TextField fullWidth placeholder="Ej: Hielo" size="small" variant="filled"
                                                    value={itemTemp.nombre} onChange={e=>setItemTemp({...itemTemp, nombre:e.target.value})}
                                                    InputProps={{ disableUnderline: true }} sx={{ bgcolor: 'white', borderRadius: 2 }}
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <TextField fullWidth placeholder="#" type="number" size="small" variant="filled"
                                                    value={itemTemp.objetivo} onChange={e=>setItemTemp({...itemTemp, objetivo:e.target.value})}
                                                    InputProps={{ disableUnderline: true, inputProps: { min: 0 } }} sx={{ bgcolor: 'white', borderRadius: 2 }}
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Select
                                                    fullWidth
                                                    value={itemTemp.unidad}
                                                    onChange={e=>setItemTemp({...itemTemp, unidad:e.target.value})}
                                                    variant="outlined" 
                                                    displayEmpty
                                                    sx={{ 
                                                        bgcolor: 'white', 
                                                        color: 'black',
                                                        borderRadius: 2, 
                                                        height: '100%',
                                                        '&:hover': { bgcolor: 'white' },
                                                        '&.Mui-focused': { bgcolor: 'white' },
                                                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, 
                                                        '& .MuiSelect-select': { py: 1, display:'flex', alignItems:'center' },
                                                        '& .MuiSvgIcon-root': { color: 'rgba(0,0,0,0.5)' }
                                                    }}
                                                >
                                                    <MenuItem value="Unidades">Unidades</MenuItem>
                                                    <MenuItem value="Libras">Libras</MenuItem>
                                                    <MenuItem value="Cajas">Cajas</MenuItem>
                                                    <MenuItem value="Botellas">Botellas</MenuItem>
                                                    <MenuItem value="Paquetes">Paquetes</MenuItem>
                                                    <MenuItem value="Latas">Latas</MenuItem>
                                                </Select>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Button fullWidth variant="contained" color="secondary" onClick={agregarItemInicial} startIcon={<PlaylistAddIcon/>}>
                                                    Añadir Item
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    {listaInicial.length > 0 && (
                                        <Box sx={{ maxHeight: 120, overflowY: 'auto', mb: 3, pr: 1 }}>
                                            {listaInicial.map((item, idx) => (
                                                <Box key={idx} display="flex" justifyContent="space-between" alignItems="center" bgcolor="rgba(255,255,255,0.1)" p={1} borderRadius={2} mb={0.5}>
                                                    <Typography variant="body2" sx={{pl:1}}>{item.nombre} ({item.objetivo} {item.unidad})</Typography>
                                                    <IconButton size="small" onClick={()=>eliminarItemInicial(idx)} sx={{color:'white', opacity:0.7}}><DeleteOutlineIcon fontSize="small"/></IconButton>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}

                                    <Button fullWidth variant="contained" color="secondary" size="large" onClick={crearEventoCompleto} sx={{ color: '#000', py: 1.5, mt: 1 }}>
                                        Crear Evento
                                    </Button>
                                </Paper>
                            </Fade>
                        </Grid>
                    )}

                    {/* --- LISTA DE EVENTOS (NUEVAS TARJETAS PREMIUN) --- */}
                    <Grid item xs={12} md={isMasterAdmin ? 7 : 12}>
                        <Box mb={5} textAlign={isMasterAdmin ? 'left' : 'center'}>
                            <Typography variant="h3" gutterBottom sx={{ background: 'linear-gradient(45deg, #37474F 30%, #26A69A 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Próximos Eventos
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: isMasterAdmin ? 0 : 'auto' }}>
                                Selecciona un evento para ver qué hace falta y colaborar.
                            </Typography>
                        </Box>
                        
                        {eventos.length === 0 ? (
                            <Box textAlign="center" py={8} sx={{ opacity: 0.5 }}>
                                <EventIcon sx={{ fontSize: 80, mb: 2, color: 'text.disabled' }}/>
                                <Typography variant="h6">No hay eventos activos</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={3} justifyContent={isMasterAdmin ? 'flex-start' : 'center'}>
                                {eventos.map(ev => (
                                    <Grid item xs={12} sm={6} md={isMasterAdmin ? 12 : 4} key={ev.id}>
                                        <Card 
                                            onClick={() => window.location.href = `/?id=${ev.id}`}
                                            sx={{ 
                                                cursor: 'pointer', position: 'relative', overflow: 'hidden',
                                                bgcolor: modoOscuro ? '#1F2933' : '#FFFFFF',
                                                border: '1px solid',
                                                borderColor: modoOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                                boxShadow: modoOscuro ? '0 8px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.03)',
                                                '&:hover': { 
                                                    transform: 'translateY(-6px)', 
                                                    boxShadow: modoOscuro ? '0 15px 40px rgba(0,0,0,0.6)' : '0 20px 40px rgba(0,191,165,0.15)',
                                                    borderColor: 'secondary.main'
                                                } 
                                            }}
                                        >
                                            {/* BARRA SUPERIOR NANO */}
                                            <Box sx={{ height: 10, background: 'linear-gradient(90deg, #263238 0%, #004D40 100%)', width: '100%' }} />
                                            
                                            <CardContent sx={{ p: 3, pb: 2 }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                                                    <Box>
                                                        <Typography variant="h6" fontWeight={800} sx={{ lineHeight:1.2, mb:1 }}>{ev.nombre}</Typography>
                                                        {ev.fecha && (
                                                            <Chip 
                                                                icon={<CalendarTodayIcon sx={{fontSize:'13px !important'}}/>} 
                                                                label={ev.fecha} 
                                                                size="small" 
                                                                sx={{
                                                                    height: 24, fontSize: '0.75rem', 
                                                                    bgcolor: modoOscuro ? 'rgba(255,255,255,0.1)' : 'rgba(38, 166, 154, 0.1)', 
                                                                    color: modoOscuro ? '#B0BEC5' : '#00695C',
                                                                    fontWeight: 600
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                    {isMasterAdmin && (
                                                        <IconButton size="small" color="error" onClick={(e)=>borrarEvento(e, ev.id)} sx={{ bgcolor: 'rgba(255,0,0,0.05)' }}>
                                                            <DeleteOutlineIcon fontSize="small"/>
                                                        </IconButton>
                                                    )}
                                                </Box>

                                                <Divider sx={{ borderStyle: 'dashed', my: 2, opacity: 0.6 }} />

                                                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                                                    <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ flexGrow: 1 }}>
                                                        Ver detalles del evento
                                                    </Typography>
                                                    
                                                    {/* FLECHA ESTILIZADA */}
                                                    <Avatar sx={{ 
                                                        bgcolor: 'transparent', 
                                                        border: '1px solid',
                                                        borderColor: 'secondary.main',
                                                        color: 'secondary.main',
                                                        width: 32, height: 32,
                                                        transition: '0.2s',
                                                        '.MuiCard-root:hover &': {
                                                            bgcolor: 'secondary.main',
                                                            color: 'white',
                                                            transform: 'translateX(4px)'
                                                        }
                                                    }}>
                                                        <ArrowForwardIcon fontSize="small"/>
                                                    </Avatar>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            </Container>

            {/* MODAL LOGIN */}
            <Dialog open={modalLoginOpen} onClose={()=>setModalLoginOpen(false)}>
                <DialogTitle>Acceso Maestro</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <TextField fullWidth label="Usuario" margin="dense" value={loginData.user} onChange={e=>setLoginData({...loginData, user:e.target.value})} autoFocus/>
                    <TextField fullWidth type="password" label="Contraseña" margin="dense" value={loginData.pass} onChange={e=>setLoginData({...loginData, pass:e.target.value})}/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={()=>setModalLoginOpen(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={submitLogin}>Entrar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// ==========================================
// VISTA 2: EL EVENTO (NANO BANNER REAL)
// ==========================================
function VistaEvento({ eventoId, modoOscuro, setModoOscuro }) {
    const [nombreEvento, setNombreEvento] = useState("Cargando...");
    const [fechaEvento, setFechaEvento] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    
    // UI & Modales
    const [modalLogin, setModalLogin] = useState(false);
    const [passAdmin, setPassAdmin] = useState("");
    const [modalAporte, setModalAporte] = useState(false);
    const [mostrarConfeti, setMostrarConfeti] = useState(false);
    
    // CORRECCIÓN CONFETI: Usamos useRef para "memoria persistente" que no se borra al recargar
    const metasCelebradasRef = useRef(new Set()); 

    const [toast, setToast] = useState({ open: false, msg: '', type: 'info' });

    const [metas, setMetas] = useState([]);
    const [aportes, setAportes] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("Todas");

    const [nuevaMeta, setNuevaMeta] = useState({ nombre: '', objetivo: '', unidad: 'Unidades', categoria: 'Comida', prioridad: 'Normal' });
    
    // CORRECCIÓN CAMPOS SEPARADOS
    const [nuevoAporte, setNuevoAporte] = useState({ cantidad: '', encargado: '' }); 
    const [inputNombre, setInputNombre] = useState('');
    const [inputApellido, setInputApellido] = useState('');

    const [metaSeleccionada, setMetaSeleccionada] = useState(null);
    const [esEdicion, setEsEdicion] = useState(false); 

    useEffect(() => {
        recargarDatos();
        const interval = setInterval(() => { if(!modalLogin && !modalAporte) recargarDatos() }, 4000);
        return () => clearInterval(interval);
    }, [eventoId]);

    const recargarDatos = async () => {
        try {
            const resEvt = await api.get(`/evento/${eventoId}`);
            setNombreEvento(resEvt.data.nombre); 
            setFechaEvento(resEvt.data.fecha);
            const [resM, resA] = await Promise.all([api.get(`/metas/${eventoId}`), api.get(`/aportes/evento/${eventoId}`)]);
            setMetas(resM.data); 
            setAportes(resA.data);
            verificarCompletados(resM.data, resA.data);
        } catch(e) { console.error(e); }
    };

    // LOGICA DE CONFETI: Ahora usa metasCelebradasRef para ser inmune al reseteo del intervalo
    const verificarCompletados = (ms, as) => {
        let hayNuevaCelebracion = false;
        const celebradas = metasCelebradasRef.current;

        ms.forEach(m => {
            const t = as.filter(a => a.meta_id === m.id).reduce((s, a) => s + a.cantidad, 0);
            
            // Si está completa Y NO está en la memoria persistente
            if(t >= m.objetivo && t > 0 && !celebradas.has(m.id)) {
                hayNuevaCelebracion = true;
                celebradas.add(m.id);
            }
        });

        if(hayNuevaCelebracion) {
            setMostrarConfeti(true);
            // El Set dentro de useRef ya se actualizó arriba, no necesitamos setState
        }
    };

    const verificarAdmin = async () => {
        try {
            await api.post('/verificar-admin', { evento_id: eventoId, password: passAdmin });
            setIsAdmin(true); setModalLogin(false); setPassAdmin(""); 
            setToast({open:true, msg: "¡Hola Admin!", type:'success'});
        } catch { setToast({open:true, msg: "Contraseña incorrecta", type:'error'}); }
    };

    const crearMeta = async (e) => {
        e.preventDefault();
        if(!nuevaMeta.nombre || !nuevaMeta.objetivo || nuevaMeta.objetivo <= 0) return alert("Revisa el nombre y que la cantidad sea positiva.");
        await api.post(`/metas/${eventoId}`, nuevaMeta);
        setNuevaMeta({ nombre: '', objetivo: '', unidad: 'Unidades', categoria: 'Comida', prioridad: 'Normal' });
        recargarDatos(); setToast({open:true, msg:"Necesidad agregada", type:'success'});
    };

    const guardarAporteInteligente = async () => {
         const cantidadNum = parseInt(nuevoAporte.cantidad);
         
         // 1. VALIDAR CAMPOS SEPARADOS
         if(!inputNombre.trim() || !inputApellido.trim() || !cantidadNum || cantidadNum <= 0) {
             return setToast({open:true, msg: "Todos los campos son obligatorios", type:'error'});
         }

         // 2. VALIDAR SOLO LETRAS
         const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
         if (!soloLetras.test(inputNombre) || !soloLetras.test(inputApellido)) {
            return setToast({open:true, msg: "El nombre y apellido no pueden tener números", type:'warning'});
         }

         // Combinar nombre
         const nombreCompleto = `${inputNombre.trim()} ${inputApellido.trim()}`;

         const totalActual = aportes.filter(a => a.meta_id === metaSeleccionada.id).reduce((s, a) => s + a.cantidad, 0);
         
         if (esEdicion) {
             await api.delete(`/aportes/${nuevoAporte.id_old}`); 
             await api.post('/aportes', {encargado: nombreCompleto, cantidad: cantidadNum, meta_id: metaSeleccionada.id}); 
             setModalAporte(false);
             recargarDatos();
             setToast({open:true, msg: "Aporte actualizado", type:'success'});
         } else {
             if (totalActual >= metaSeleccionada.objetivo) return setToast({open:true, msg: "Meta llena", type:'error'});
             
             const existe = aportes.some(a => a.meta_id === metaSeleccionada.id && a.encargado.toLowerCase().trim() === nombreCompleto.toLowerCase().trim());
             if (existe) return setToast({open:true, msg: "Ya estás registrado aquí", type:'warning'});

             await api.post('/aportes', {encargado: nombreCompleto, cantidad: cantidadNum, meta_id: metaSeleccionada.id});
             setModalAporte(false);
             recargarDatos();
             setToast({open:true, msg: "Aporte registrado", type:'success'});
         }
    };

    const prepararAporteNuevo = (meta) => {
        setMetaSeleccionada(meta);
        setNuevoAporte({cantidad: ''});
        setInputNombre('');
        setInputApellido('');
        setEsEdicion(false); 
        setModalAporte(true);
    };

    const prepararEdicionAporte = (meta, aporte) => {
        setMetaSeleccionada(meta);
        // Intentar separar nombre y apellido del string guardado
        const partes = aporte.encargado.split(' ');
        const nombre = partes[0] || '';
        const apellido = partes.slice(1).join(' ') || '';

        setInputNombre(nombre);
        setInputApellido(apellido);
        setNuevoAporte({cantidad: aporte.cantidad, id_old: aporte.id});
        setEsEdicion(true);
        setModalAporte(true);
    };

    const eliminarMeta = async (id) => { if(window.confirm("¿Borrar?")) await api.delete(`/metas/${id}`).then(recargarDatos); };
    const eliminarAporte = async (id) => await api.delete(`/aportes/${id}`).then(recargarDatos);

    const getProgreso = (metaId, objetivo) => {
        const t = aportes.filter(a => a.meta_id === metaId).reduce((s, a) => s + a.cantidad, 0);
        return { total: t, porcentaje: Math.min((t/objetivo)*100, 100), completo: t >= objetivo };
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
            {mostrarConfeti && <Confetti numberOfPieces={400} recycle={false} onConfettiComplete={()=>setMostrarConfeti(false)} />}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 4, px: 2 }}>
                <Paper elevation={4} sx={{ 
                    background: 'linear-gradient(90deg, #263238 0%, #004D40 100%)', 
                    color: 'white', 
                    borderRadius: 50, 
                    px: 3, 
                    py: 1.5, 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    maxWidth: 900,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <IconButton onClick={() => window.location.href = window.location.origin} size="small" sx={{ bgcolor: 'white', color: '#263238', '&:hover':{ bgcolor:'#ECEFF1' } }}>
                            <HomeIcon fontSize="small"/>
                        </IconButton>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.1 }}>{nombreEvento}</Typography>
                            {fechaEvento && (
                                <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>📅 {fechaEvento}</Typography>
                            )}
                        </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                        <IconButton 
                             onClick={()=>{navigator.clipboard.writeText(window.location.href); setToast({open:true, msg:'Link copiado', type:'info'})}}
                             sx={{ color: 'white' }} size="small"
                        >
                            <ShareIcon fontSize="small"/>
                        </IconButton>
                        <Button 
                            size="small"
                            variant="contained" 
                            color={isAdmin ? "secondary" : "inherit"} 
                            onClick={()=>isAdmin ? setIsAdmin(false) : setModalLogin(true)}
                            sx={{ borderRadius: 20, textTransform: 'none', px: 2, bgcolor: isAdmin ? '#26A69A' : 'rgba(255,255,255,0.15)', color:'white', boxShadow:'none', fontSize: '0.8rem' }}
                        >
                            {isAdmin ? "Admin ON" : "Acceder"}
                        </Button>
                        <IconButton onClick={()=>setModoOscuro(!modoOscuro)} size="small" sx={{ color: 'white' }}>
                            {modoOscuro ? <LightModeIcon fontSize="small"/> : <DarkModeIcon fontSize="small"/>}
                        </IconButton>
                    </Box>
                </Paper>
            </Box>

            <Container maxWidth="lg">
                <Grid container spacing={5}>
                    {/* --- AGREGAR NECESIDAD (SOLO ADMIN) --- */}
                    {isAdmin ? (
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 4, position: 'sticky', top: 100, borderRadius: 6, boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                                    <AddCircleIcon color="secondary"/> Nueva Necesidad
                                </Typography>
                                <form onSubmit={crearMeta}>
                                    <TextField fullWidth label="Nombre (ej: Refrescos)" value={nuevaMeta.nombre} onChange={e=>setNuevaMeta({...nuevaMeta, nombre:e.target.value})} margin="dense" variant="outlined" />
                                    <Grid container spacing={2} mb={2} mt={0}>
                                        <Grid item xs={6}>
                                            <TextField fullWidth type="number" label="Cantidad" value={nuevaMeta.objetivo} onChange={e=>setNuevaMeta({...nuevaMeta, objetivo:e.target.value})} margin="dense" inputProps={{ min: 1 }}/>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <FormControl fullWidth margin="dense">
                                                <InputLabel>Unidad</InputLabel>
                                                <Select value={nuevaMeta.unidad} label="Unidad" onChange={e=>setNuevaMeta({...nuevaMeta, unidad:e.target.value})}>
                                                    <MenuItem value="Unidades">Unidades</MenuItem>
                                                    <MenuItem value="Libras">Libras</MenuItem>
                                                    <MenuItem value="Cajas">Cajas</MenuItem>
                                                    <MenuItem value="Botellas">Botellas</MenuItem>
                                                    <MenuItem value="Paquetes">Paquetes</MenuItem>
                                                    <MenuItem value="Latas">Latas</MenuItem>
                                                    <MenuItem value="Galones">Galones</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                    <Button fullWidth variant="contained" color="primary" type="submit" size="large" sx={{mt:1}}>Agregar</Button>
                                </form>
                            </Paper>
                        </Grid>
                    ) : (
                        metas.length === 0 && (
                            <Grid item xs={12}>
                                <Box textAlign="center" py={5} sx={{ opacity: 0.7 }}>
                                    <SentimentDissatisfiedIcon sx={{ fontSize: 60, mb: 2, color: 'text.secondary' }} />
                                    <Typography variant="h6" color="text.secondary">Todo tranquilo por aquí.</Typography>
                                    <Typography variant="body2" color="text.secondary">Aún no hay lista de necesidades para este evento.</Typography>
                                </Box>
                            </Grid>
                        )
                    )}

                    {/* --- LISTA DE METAS (DOBLE COLUMNA) --- */}
                    <Grid item xs={12} md={isAdmin ? 8 : 12}>
                        {metas.length > 0 && (
                            <Box display="flex" gap={2} mb={4}>
                                <TextField fullWidth placeholder="Buscar..." size="small" value={busqueda} onChange={e=>setBusqueda(e.target.value)} 
                                    InputProps={{ startAdornment: <SearchIcon color="action" sx={{mr:1}}/>, sx: { borderRadius: 3 } }}
                                    sx={{ bgcolor: 'background.paper' }}
                                />
                                <FormControl size="small" sx={{ minWidth: 140, bgcolor: 'background.paper', borderRadius: 3 }}>
                                    <Select value={filtroCategoria} onChange={e=>setFiltroCategoria(e.target.value)} displayEmpty inputProps={{ sx: { borderRadius: 3 } }}>
                                        <MenuItem value="Todas">Todas</MenuItem><MenuItem value="Comida">Comida</MenuItem><MenuItem value="Bebidas">Bebidas</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
                        
                        {/* AQUI IMPLEMENTAMOS LA DOBLE COLUMNA */}
                        <Grid container spacing={2}>
                            {metas.filter(m => m.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(meta => {
                                const { total, porcentaje, completo } = getProgreso(meta.id, meta.objetivo);
                                return (
                                    <Grid item xs={12} md={6} key={meta.id}>
                                        <Fade in>
                                            <Card sx={{ borderLeft: `6px solid ${completo ? '#66BB6A' : '#37474F'}`, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight={700} sx={{ textDecoration: completo ? 'line-through' : 'none', color: completo ? 'text.secondary' : 'text.primary', lineHeight: 1.2 }}>
                                                            {meta.nombre}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Meta: {meta.objetivo} {meta.unidad}
                                                        </Typography>
                                                    </Box>
                                                    <Box textAlign="right">
                                                        {completo ? (
                                                            <Chip icon={<CheckCircleIcon/>} label="LISTO" color="success" size="small" variant="filled" sx={{ fontWeight: 800 }} />
                                                        ) : (
                                                            <Chip label={`${total} / ${meta.objetivo}`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                                                        )}
                                                        {isAdmin && (
                                                            <IconButton size="small" color="error" onClick={()=>eliminarMeta(meta.id)} sx={{ ml: 0.5 }}>
                                                                <DeleteOutlineIcon fontSize="small"/>
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                </Box>
                                                
                                                <Box sx={{ px: 2, pb: 1 }}>
                                                    <LinearProgress variant="determinate" value={porcentaje} color={completo ? "success" : "secondary"} sx={{ height: 6, borderRadius: 4, bgcolor: modoOscuro ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}/>
                                                </Box>

                                                <Divider/>

                                                <Box sx={{ bgcolor: 'background.default', p: 1.5, flexGrow: 1 }}>
                                                    <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
                                                        {aportes.filter(a => a.meta_id === meta.id).map(ap => (
                                                            <Box key={ap.id} display="flex" alignItems="center" justifyContent="space-between" mb={0.5} p={1} bgcolor="background.paper" borderRadius={2} border="1px solid rgba(0,0,0,0.03)">
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: 'secondary.main', color:'white', fontWeight:'bold' }}>
                                                                        {ap.encargado.charAt(0).toUpperCase()}
                                                                    </Avatar>
                                                                    <Typography variant="caption" fontWeight="600" sx={{ lineHeight: 1.1 }}>
                                                                        {ap.encargado} ({ap.cantidad})
                                                                    </Typography>
                                                                </Box>
                                                                <Box>
                                                                    <IconButton size="small" sx={{ p: 0.5 }} onClick={() => prepararEdicionAporte(meta, ap)}>
                                                                        <EditIcon sx={{ fontSize: 16 }} color="action"/>
                                                                    </IconButton>
                                                                    {isAdmin && (
                                                                        <IconButton size="small" sx={{ p: 0.5 }} onClick={()=>eliminarAporte(ap.id)}>
                                                                            <DeleteOutlineIcon sx={{ fontSize: 16 }} color="error"/>
                                                                        </IconButton>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                    
                                                    {!completo && (
                                                        <Button 
                                                            fullWidth variant="outlined" color="primary" size="small" startIcon={<AddCircleIcon/>} 
                                                            onClick={() => prepararAporteNuevo(meta)}
                                                            sx={{ mt: 1, borderStyle: 'dashed', borderRadius: 2 }}
                                                        >
                                                            Yo llevo
                                                        </Button>
                                                    )}
                                                </Box>
                                            </Card>
                                        </Fade>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </Grid>
                </Grid>
            </Container>

            {/* MODAL APORTAR / EDITAR MEJORADO */}
            <Dialog open={modalAporte} onClose={()=>setModalAporte(false)} maxWidth="xs" fullWidth PaperProps={{sx:{borderRadius: 5}}}>
                <DialogTitle sx={{textAlign:'center', fontWeight:'bold'}}>
                    {esEdicion ? "Editar Aporte" : `Aportar a ${metaSeleccionada?.nombre}`}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText paragraph textAlign="center" sx={{ fontSize: '0.85rem', mb: 2 }}>
                        Ingresa tus datos reales.
                    </DialogContentText>
                    
                    <Grid container spacing={2} mb={2}>
                        <Grid item xs={6}>
                             <TextField 
                                autoFocus margin="dense" 
                                label="Nombre" 
                                placeholder="Ej: Juan"
                                fullWidth variant="filled" 
                                InputProps={{disableUnderline:true, sx:{borderRadius:3}, startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small"/></InputAdornment>}} 
                                value={inputNombre} 
                                onChange={e=>setInputNombre(e.target.value)} 
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField 
                                margin="dense" 
                                label="Apellido" 
                                placeholder="Ej: Perez"
                                fullWidth variant="filled" 
                                InputProps={{disableUnderline:true, sx:{borderRadius:3}}} 
                                value={inputApellido} 
                                onChange={e=>setInputApellido(e.target.value)} 
                            />
                        </Grid>
                    </Grid>

                    <TextField 
                        margin="dense" 
                        label={`Cantidad a llevar (${metaSeleccionada?.unidad})`} 
                        type="number" fullWidth variant="filled" 
                        InputProps={{disableUnderline:true, sx:{borderRadius:3}, inputProps: { min: 1 }}} 
                        value={nuevoAporte.cantidad} 
                        onChange={e=>setNuevoAporte({...nuevoAporte, cantidad:e.target.value})}
                    />
                </DialogContent>
                <DialogActions sx={{justifyContent:'center', pb:3}}>
                    <Button onClick={()=>setModalAporte(false)} sx={{mr:2, color:'text.secondary'}}>Cancelar</Button>
                    <Button onClick={guardarAporteInteligente} variant="contained" color="secondary" size="large" sx={{px:4}}>
                        {esEdicion ? "Actualizar" : "Guardar"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL LOGIN */}
            <Dialog open={modalLogin} onClose={()=>setModalLogin(false)} PaperProps={{sx:{borderRadius: 5}}}>
                <DialogTitle sx={{textAlign:'center'}}>Administrar Evento</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" type="password" placeholder="Contraseña del evento" fullWidth variant="filled" InputProps={{disableUnderline:true, sx:{borderRadius:3}}} value={passAdmin} onChange={e=>setPassAdmin(e.target.value)}/>
                </DialogContent>
                <DialogActions sx={{justifyContent:'center', pb:3}}>
                    <Button onClick={()=>setModalLogin(false)}>Cancelar</Button>
                    <Button onClick={verificarAdmin} variant="contained" size="large">Acceder</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={toast.open} autoHideDuration={3000} onClose={()=>setToast({...toast, open:false})} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={toast.type} variant="filled" sx={{borderRadius: 3}}>{toast.msg}</Alert>
            </Snackbar>
        </Box>
    );
}

export default App;