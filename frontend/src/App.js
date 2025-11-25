import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Confetti from 'react-confetti';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Container, Typography, Box, TextField, Button, 
  Card, CardContent, IconButton, Checkbox, Grid,
  Paper, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, 
  Chip, Fade, Tooltip, MenuItem, Select, FormControl, InputLabel, InputAdornment
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LunchDiningIcon from '@mui/icons-material/LunchDining'; 
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import EditIcon from '@mui/icons-material/Edit';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import CakeIcon from '@mui/icons-material/Cake';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';
import CelebrationIcon from '@mui/icons-material/Celebration';
import ShareIcon from '@mui/icons-material/Share'; // NUEVO
import SearchIcon from '@mui/icons-material/Search'; // NUEVO
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'; // NUEVO

// --- TEMA ---
const theme = createTheme({
  typography: {
    fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600, letterSpacing: '-0.5px' },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  palette: {
    primary: { main: '#455A64' },
    secondary: { main: '#D4AC0D' },
    error: { main: '#E57373' },
    background: { default: '#F2F4F6' },
    text: { primary: '#263238', secondary: '#546E7A' }
  },
  shape: { borderRadius: 16 },
});

// URL DEL BACKEND (Recuerda cambiar a Render cuando subas)
const api = axios.create({ baseURL: 'http://localhost:5000' }); 

const categorias = [
  { nombre: "Comida", icono: <LocalPizzaIcon fontSize="small" /> },
  { nombre: "Bebidas", icono: <LocalBarIcon fontSize="small" /> },
  { nombre: "Postres", icono: <CakeIcon fontSize="small" /> },
  { nombre: "Desechables", icono: <LunchDiningIcon fontSize="small" /> },
  { nombre: "Decoración", icono: <CelebrationIcon fontSize="small" /> },
  { nombre: "Otros", icono: <EmojiEventsIcon fontSize="small" /> }
];

function App() {
  const [nombreEvento, setNombreEvento] = useState("Cargando...");
  const [fechaEvento, setFechaEvento] = useState(""); // NUEVO: Estado Fecha
  const [editandoConfig, setEditandoConfig] = useState(false); // Cambiado nombre para incluir fecha
  
  const [metas, setMetas] = useState([]);
  const [aportes, setAportes] = useState([]);
  const [busqueda, setBusqueda] = useState(""); // NUEVO: Estado Búsqueda
  
  const [nuevaMeta, setNuevaMeta] = useState({ nombre: '', objetivo: '', categoria: 'Comida' });
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [metaSeleccionada, setMetaSeleccionada] = useState(null);
  const [nuevoAporte, setNuevoAporte] = useState({ encargado: '', cantidad: '' });
  const [aporteEditandoId, setAporteEditandoId] = useState(null);
  const [mostrarConfeti, setMostrarConfeti] = useState(false);

  useEffect(() => { recargarDatos(); }, []);

  const recargarDatos = async () => {
    try {
      const resConfig = await api.get('/config');
      const resMetas = await api.get('/metas');
      const resAportes = await api.get('/aportes');
      
      setNombreEvento(resConfig.data.nombre);
      setFechaEvento(resConfig.data.fecha || ""); // Cargar fecha
      
      setMetas(resMetas.data);
      setAportes(resAportes.data);
      verificarCompletados(resMetas.data, resAportes.data);
    } catch (error) { console.error("Error", error); }
  };

  // Lógica de Búsqueda (Filtro)
  const metasFiltradas = metas.filter(meta => 
    meta.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    meta.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  const verificarCompletados = (misMetas, misAportes) => {
    let hayCelebracion = false;
    misMetas.forEach(m => {
      const total = misAportes.filter(a => a.meta_id === m.id).reduce((s, a) => s + a.cantidad, 0);
      if (total >= m.objetivo && total > 0) hayCelebracion = true;
    });
    if (hayCelebracion) setMostrarConfeti(true);
  };

  const guardarConfiguracion = async () => {
    await api.put('/config', { nombre: nombreEvento, fecha: fechaEvento });
    setEditandoConfig(false);
    toast.success("Evento actualizado");
  };

  // NUEVO: Función Compartir
  const compartirEvento = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("¡Link copiado al portapapeles!", { icon: '🔗' });
  };

  const reiniciarTodo = async () => {
    if (window.confirm("⚠️ ¿Reiniciar todo el evento?")) {
      await api.delete('/reset');
      setMostrarConfeti(false);
      recargarDatos();
      toast("Evento reiniciado", { icon: '🧹' });
    }
  };

  const crearMeta = async (e) => {
    e.preventDefault();
    if (!nuevaMeta.nombre || !nuevaMeta.objetivo) {
        toast.error("Faltan datos por llenar");
        return;
    }
    try {
      await api.post('/metas', nuevaMeta);
      toast.success("Misión agregada");
      setNuevaMeta({ nombre: '', objetivo: '', categoria: 'Comida' });
      recargarDatos();
    } catch (error) {
      if (error.response && error.response.data.error) toast.error(error.response.data.error);
      else toast.error("Error de conexión");
    }
  };

  const eliminarMeta = async (id) => {
      await api.delete(`/metas/${id}`);
      recargarDatos();
      toast.success("Eliminado");
  };
  
  const guardarAporte = async () => {
    if (!nuevoAporte.encargado || !nuevoAporte.cantidad) {
        toast.error("Llena todos los campos");
        return;
    }
    try {
        const payload = { ...nuevoAporte, meta_id: metaSeleccionada?.id };
        if (aporteEditandoId) await api.put(`/aportes/${aporteEditandoId}`, payload);
        else await api.post('/aportes', payload);
        
        setModalAbierto(false);
        recargarDatos();
        toast.success(aporteEditandoId ? "Aporte actualizado" : "¡Gracias por aportar!");
    } catch (error) {
        if (error.response && error.response.data.error) toast.error(error.response.data.error);
    }
  };

  const eliminarAporte = async (id) => await api.delete(`/aportes/${id}`).then(recargarDatos);
  const toggleEstadoAporte = async (a) => await api.put(`/aportes/${a.id}`, { estado: !a.estado }).then(recargarDatos);

  const abrirModalAporte = (meta, aporte = null) => {
    setMetaSeleccionada(meta);
    if (aporte) {
      setAporteEditandoId(aporte.id);
      setNuevoAporte({ encargado: aporte.encargado, cantidad: aporte.cantidad });
    } else {
      setAporteEditandoId(null);
      setNuevoAporte({ encargado: '', cantidad: '' });
    }
    setModalAbierto(true);
  };

  const getProgreso = (metaId, objetivo) => {
    const lista = aportes.filter(a => a.meta_id === metaId);
    const total = lista.reduce((s, a) => s + a.cantidad, 0);
    return { total, porcentaje: Math.min((total/objetivo)*100, 100), completo: total >= objetivo, lista };
  };

  return (
    <ThemeProvider theme={theme}>
      <Toaster position="top-center" reverseOrder={false} />
      {mostrarConfeti && <Confetti numberOfPieces={200} recycle={false} />}
      
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8 }}>
        
        {/* HEADER ACTUALIZADO */}
        <Paper elevation={0} sx={{ bgcolor: 'white', pt: 4, pb: 4, mb: 5, borderBottom: '1px solid #E0E0E0', borderRadius: '0 0 30px 30px' }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                
                {/* Título e Info del Evento */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: '#F5F7F8', p: 1.5, borderRadius: '50%', color: 'secondary.main' }}><LunchDiningIcon sx={{ fontSize: 40 }} /></Box>
                    <Box>
                        <Typography variant="overline" color="text.secondary" fontWeight="bold" letterSpacing={2}>EventBite - GESTIÓN DE EVENTOS</Typography>
                        
                        {editandoConfig ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                            <TextField variant="standard" label="Nombre Evento" value={nombreEvento} onChange={(e) => setNombreEvento(e.target.value)} autoFocus />
                            <TextField type="date" variant="standard" value={fechaEvento} onChange={(e) => setFechaEvento(e.target.value)} />
                            <Button size="small" variant="contained" onClick={guardarConfiguracion}>Guardar Cambios</Button>
                        </Box>
                        ) : (
                        <Box>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => setEditandoConfig(true)}>
                                <Typography variant="h4" color="primary.main">{nombreEvento}</Typography>
                                <Tooltip title="Editar info"><EditIcon sx={{ fontSize: 18, color: '#CFD8DC' }} /></Tooltip>
                            </Box>
                            {fechaEvento && (
                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                    <CalendarMonthIcon fontSize="small"/> {fechaEvento}
                                </Typography>
                            )}
                        </Box>
                        )}
                    </Box>
                </Box>

                {/* Botones de Acción Header */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button variant="outlined" startIcon={<ShareIcon />} onClick={compartirEvento}>Compartir</Button>
                    <Chip label={`${metas.length} Metas`} sx={{ bgcolor: '#ECEFF1', fontWeight: 600 }} />
                </Box>
            </Box>
          </Container>
        </Paper>

        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* IZQUIERDA: FORMULARIO */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, position: 'sticky', top: 20, border: '1px solid white' }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><AddCircleOutlineIcon color="primary" />Crear Misión</Typography>
                <form onSubmit={crearMeta}>
                  <TextField fullWidth label="Item (ej: Refrescos)" variant="outlined" size="small" margin="dense" value={nuevaMeta.nombre} onChange={(e) => setNuevaMeta({...nuevaMeta, nombre: e.target.value})} sx={{ bgcolor: '#FAFAFA' }} />
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                        <TextField fullWidth label="Cantidad" type="number" variant="outlined" size="small" margin="dense" value={nuevaMeta.objetivo} onChange={(e) => setNuevaMeta({...nuevaMeta, objetivo: e.target.value})} sx={{ bgcolor: '#FAFAFA' }} />
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth size="small" margin="dense">
                            <InputLabel>Categoría</InputLabel>
                            <Select value={nuevaMeta.categoria} label="Categoría" onChange={(e) => setNuevaMeta({...nuevaMeta, categoria: e.target.value})}>
                                {categorias.map((cat) => ( <MenuItem key={cat.nombre} value={cat.nombre}>{cat.nombre}</MenuItem> ))}
                            </Select>
                        </FormControl>
                    </Grid>
                  </Grid>
                  <Button fullWidth variant="contained" color="primary" type="submit" sx={{ mt: 2 }}>Agregar a la Lista</Button>
                </form>
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #CFD8DC', textAlign: 'center' }}>
                  <Button fullWidth variant="outlined" color="error" startIcon={<RestartAltIcon />} onClick={reiniciarTodo} sx={{ borderColor: '#FFCDD2', color: '#E57373' }}>Reiniciar Todo</Button>
                </Box>
              </Paper>
            </Grid>

            {/* DERECHA: LISTA CON BUSCADOR */}
            <Grid item xs={12} md={8}>
                {/* BARRA DE BÚSQUEDA */}
                <TextField 
                    fullWidth 
                    placeholder="Buscar empanadas, bebidas..." 
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    sx={{ mb: 3, bgcolor: 'white', borderRadius: 1 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />

              {metasFiltradas.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 10, opacity: 0.6 }}>
                    <LunchDiningIcon sx={{ fontSize: 60, color: '#CFD8DC', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        {busqueda ? "No se encontraron resultados" : "Tu lista está vacía"}
                    </Typography>
                </Box>
              ) : (
                metasFiltradas.map((meta) => { // USAMOS METAS FILTRADAS AQUÍ
                  const { total, porcentaje, completo, lista } = getProgreso(meta.id, meta.objetivo);
                  const catData = categorias.find(c => c.nombre === meta.categoria) || categorias[5];

                  return (
                    <Fade in={true} key={meta.id}>
                      <Card sx={{ mb: 3, border: '1px solid transparent', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' } }}>
                        <Box sx={{ p: 2.5, bgcolor: completo ? '#E8F5E9' : 'white', borderBottom: '1px solid #F5F5F5' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip icon={catData.icono} label={meta.categoria || "General"} size="small" sx={{ bgcolor: 'transparent', border: '1px solid #ECEFF1', color: 'text.secondary' }} />
                                <Typography variant="h6" sx={{ color: completo ? '#2E7D32' : 'text.primary', fontWeight: 'bold' }}>{meta.nombre}</Typography> 
                                {completo && <EmojiEventsIcon sx={{ color: '#FFD700' }} />}
                            </Box>
                            <Box>
                              <Chip label={completo ? "COMPLETO" : `${total} / ${meta.objetivo}`} size="small" sx={{ bgcolor: completo ? '#C8E6C9' : '#ECEFF1', color: completo ? '#1B5E20' : '#546E7A', fontWeight: 'bold', mr: 1 }} />
                              <IconButton size="small" onClick={() => eliminarMeta(meta.id)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                            </Box>
                          </Box>
                          <LinearProgress variant="determinate" value={porcentaje} sx={{ height: 8, borderRadius: 4, bgcolor: completo ? '#C8E6C9' : '#ECEFF1', '& .MuiLinearProgress-bar': { bgcolor: completo ? '#66BB6A' : 'primary.main' } }} />
                        </Box>
                        <CardContent sx={{ pt: 1, pb: '16px !important' }}>
                          {lista.map((ap) => (
                            <Box key={ap.id} sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid #FAFAFA' }}>
                              <Checkbox checked={ap.estado} onChange={() => toggleEstadoAporte(ap)} size="small" sx={{ color: '#CFD8DC', '&.Mui-checked': { color: '#81C784' } }} />
                              <Box sx={{ flexGrow: 1, ml: 1 }}>
                                <Typography variant="body2" sx={{ textDecoration: ap.estado ? 'line-through' : 'none', color: ap.estado ? '#B0BEC5' : 'text.primary' }}>{ap.encargado}</Typography>
                                <Typography variant="caption" color="text.secondary">Lleva {ap.cantidad}</Typography>
                              </Box>
                              <IconButton size="small" onClick={() => abrirModalAporte(meta, ap)}><EditOutlinedIcon fontSize="small" sx={{ color: '#B0BEC5' }} /></IconButton>
                              <IconButton size="small" onClick={() => eliminarAporte(ap.id)}><DeleteOutlineIcon fontSize="small" sx={{ color: '#FFCDD2' }} /></IconButton>
                            </Box>
                          ))}
                          <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => abrirModalAporte(meta)} sx={{ mt: 1 }}>Aportar</Button>
                        </CardContent>
                      </Card>
                    </Fade>
                  );
                })
              )}
            </Grid>
          </Grid>
        </Container>

        <Dialog open={modalAbierto} onClose={() => setModalAbierto(false)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
          <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>{aporteEditandoId ? 'Editar Aporte' : `Aportar a ${metaSeleccionada?.nombre}`}</DialogTitle>
          <DialogContent>
            <TextField autoFocus margin="dense" label="Tu Nombre" fullWidth variant="filled" InputProps={{ disableUnderline: true, style: { borderRadius: 10 } }} value={nuevoAporte.encargado} onChange={(e) => setNuevoAporte({...nuevoAporte, encargado: e.target.value})} sx={{ mb: 2 }} />
            <TextField margin="dense" label="Cantidad" type="number" fullWidth variant="filled" InputProps={{ disableUnderline: true, style: { borderRadius: 10 } }} value={nuevoAporte.cantidad} onChange={(e) => setNuevoAporte({...nuevoAporte, cantidad: e.target.value})} />
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Button onClick={() => setModalAbierto(false)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
            <Button variant="contained" onClick={guardarAporte} sx={{ px: 4 }}>Guardar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}

export default App;