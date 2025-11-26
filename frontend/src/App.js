import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Confetti from 'react-confetti';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Container, Typography, Box, TextField, Button, 
  Card, CardContent, IconButton, Checkbox, Grid, 
  Paper, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, 
  Chip, Fade, MenuItem, Select, FormControl, InputLabel, Snackbar, Alert, InputAdornment, DialogContentText
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// --- ICONOS ---
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import EditIcon from '@mui/icons-material/Edit';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SearchIcon from '@mui/icons-material/Search';
import ShareIcon from '@mui/icons-material/Share';
import FilterListIcon from '@mui/icons-material/FilterList';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import BarChartIcon from '@mui/icons-material/BarChart';
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Nuevo Icono para Copiar

const api = axios.create({ baseURL: 'http://localhost:5000' });

const PIN_SEGURIDAD = "1234";
const COLORES_GRAFICO = ['#00C49F', '#FF8042'];

function App() {
  // --- TEMA ---
  const [modoOscuro, setModoOscuro] = useState(() => localStorage.getItem('tema') === 'dark');

  const theme = React.useMemo(() => createTheme({
    palette: {
      mode: modoOscuro ? 'dark' : 'light',
      primary: { main: modoOscuro ? '#90CAF9' : '#455A64' },
      secondary: { main: '#D4AC0D' },
      background: { default: modoOscuro ? '#121212' : '#F2F4F6', paper: modoOscuro ? '#1E1E1E' : '#ffffff' },
    },
    typography: { fontFamily: '"Poppins", sans-serif', button: { textTransform: 'none', fontWeight: 600 } },
    shape: { borderRadius: 16 },
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 16, backgroundColor: modoOscuro ? 'rgba(255, 255, 255, 0.05)' : '#FAFAFA' }
        }
      }
    }
  }), [modoOscuro]);

  const toggleTema = () => {
    setModoOscuro((prev) => {
      localStorage.setItem('tema', !prev ? 'dark' : 'light');
      return !prev;
    });
  };

  // --- ESTADOS ---
  const [nombreEvento, setNombreEvento] = useState("Cargando...");
  const [fechaEvento, setFechaEvento] = useState("");
  const [editandoConfig, setEditandoConfig] = useState(false);
  
  const [metas, setMetas] = useState([]);
  const [aportes, setAportes] = useState([]);
  
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  const [nuevaMeta, setNuevaMeta] = useState({ nombre: '', objetivo: '', categoria: 'Comida', prioridad: 'Normal' });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [metaSeleccionada, setMetaSeleccionada] = useState(null);
  const [nuevoAporte, setNuevoAporte] = useState({ encargado: '', cantidad: '' });
  const [aporteEditandoId, setAporteEditandoId] = useState(null);
  
  const [modalSeguridad, setModalSeguridad] = useState(false);
  const [pinIngresado, setPinIngresado] = useState("");
  const [accionPendiente, setAccionPendiente] = useState(null); 

  const [mostrarConfeti, setMostrarConfeti] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: '', type: 'info' }); 

  // --- CARGA DE DATOS ---
  useEffect(() => { 
    recargarDatos(); 
    const intervalo = setInterval(() => {
        if (!editandoConfig && !modalSeguridad) { 
            recargarDatos();
        }
    }, 10000);
    return () => clearInterval(intervalo);
  }, [editandoConfig, modalSeguridad]);

  const recargarDatos = async () => {
    try {
      const [resConf, resMetas, resAp] = await Promise.all([
        api.get('/config'), api.get('/metas'), api.get('/aportes')
      ]);
      
      if (!editandoConfig) {
          setNombreEvento(resConf.data.nombre);
          setFechaEvento(resConf.data.fecha || "");
      }
      setMetas(resMetas.data);
      setAportes(resAp.data);
      verificarCompletados(resMetas.data, resAp.data);
    } catch (error) { console.error("Error conexión", error); }
  };

  const mostrarToast = (msg, type = 'success') => setToast({ open: true, msg, type });
  const cerrarToast = () => setToast({ ...toast, open: false });

  const verificarCompletados = (misMetas, misAportes) => {
    let hayCelebracion = false;
    misMetas.forEach(m => {
      const total = misAportes.filter(a => a.meta_id === m.id).reduce((s, a) => s + a.cantidad, 0);
      if (total >= m.objetivo && total > 0) hayCelebracion = true;
    });
    if (hayCelebracion) setMostrarConfeti(true);
  };

  // --- NUEVA FUNCIONALIDAD: REPORTING ---
  const copiarListaWhatsApp = () => {
    let pendientes = [];
    let listos = [];

    metas.forEach(m => {
        const total = aportes.filter(a => a.meta_id === m.id).reduce((s, a) => s + a.cantidad, 0);
        if (total >= m.objetivo) {
            listos.push(m.nombre);
        } else {
            pendientes.push({ nombre: m.nombre, falta: m.objetivo - total });
        }
    });

    let reporte = `📋 *REPORTE: ${nombreEvento}* \n📅 ${fechaEvento}\n\n`;
    
    if (pendientes.length > 0) {
        reporte += `🔴 *FALTA COMPRAR:*\n`;
        pendientes.forEach(p => reporte += `❌ ${p.nombre} (Faltan ${p.falta})\n`);
        reporte += `\n`;
    }

    if (listos.length > 0) {
        reporte += `🟢 *YA TENEMOS:*\n`;
        listos.forEach(l => reporte += `✅ ${l}\n`);
    }

    reporte += `\n🔗 Entra aquí: ${window.location.href}`;

    navigator.clipboard.writeText(reporte);
    mostrarToast("📋 ¡Lista copiada! Pégala en WhatsApp", "info");
  };

  // --- SEGURIDAD ---
  const solicitarSeguridad = (accion) => {
    setAccionPendiente(() => accion); 
    setPinIngresado("");
    setModalSeguridad(true);
  };

  const verificarPin = () => {
    if (pinIngresado === PIN_SEGURIDAD) {
        setModalSeguridad(false);
        if (accionPendiente) accionPendiente(); 
        mostrarToast("Acceso autorizado", "success");
    } else {
        mostrarToast("PIN Incorrecto", "error");
        setPinIngresado("");
    }
  };

  // --- ACCIONES ---
  const guardarConfiguracion = async () => {
    solicitarSeguridad(async () => {
        await api.put('/config', { nombre: nombreEvento, fecha: fechaEvento });
        setEditandoConfig(false);
        mostrarToast("Evento actualizado correctamente");
    });
  };

  const reiniciarTodo = async () => {
    solicitarSeguridad(async () => {
        await api.delete('/reset');
        setMostrarConfeti(false);
        recargarDatos();
        mostrarToast("Sistema reiniciado de fábrica", "warning");
    });
  };

  const eliminarMeta = (id) => {
    solicitarSeguridad(async () => {
        await api.delete(`/metas/${id}`);
        recargarDatos();
        mostrarToast("Meta eliminada", "warning");
    });
  };

  const eliminarAporte = (id) => {
    solicitarSeguridad(async () => {
        await api.delete(`/aportes/${id}`);
        recargarDatos();
        mostrarToast("Aporte eliminado", "warning");
    });
  };

  const crearMeta = async (e) => {
    e.preventDefault();
    if (!nuevaMeta.nombre || !nuevaMeta.objetivo) return mostrarToast("Faltan datos", "error");
    if (nuevaMeta.objetivo <= 0) return mostrarToast("El objetivo debe ser positivo", "error");
    try {
      await api.post('/metas', nuevaMeta);
      setNuevaMeta({ nombre: '', objetivo: '', categoria: 'Comida', prioridad: 'Normal' });
      recargarDatos();
      mostrarToast("Misión agregada", "success");
    } catch (err) { mostrarToast(err.response?.data?.error || "Error", "error"); }
  };

  const guardarAporte = async () => {
    if (!nuevoAporte.encargado || !nuevoAporte.cantidad) return;
    if (nuevoAporte.cantidad <= 0) return mostrarToast("Cantidad inválida", "error");
    const payload = { ...nuevoAporte, meta_id: metaSeleccionada?.id };
    try {
      if (aporteEditandoId) await api.put(`/aportes/${aporteEditandoId}`, payload);
      else await api.post('/aportes', payload);
      setModalAbierto(false);
      recargarDatos();
      mostrarToast("Aporte registrado", "success");
    } catch (err) { mostrarToast("Error al guardar", "error"); }
  };

  const compartirWhatsApp = () => {
    const texto = `Hola! Te invito a colaborar en el evento *${nombreEvento}* 📅 ${fechaEvento}. Faltan cosas por llevar.`;
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  // --- DATOS VISUALES ---
  const metasCompletas = metas.filter(m => {
    const totalAportado = aportes.filter(a => a.meta_id === m.id).reduce((sum, a) => sum + a.cantidad, 0);
    return totalAportado >= m.objetivo;
  }).length;
  const metasPendientes = metas.length - metasCompletas;
  const dataGrafico = [{ name: 'Completado', value: metasCompletas }, { name: 'Pendiente', value: metasPendientes }];

  const getProgreso = (metaId, objetivo) => {
    const lista = aportes.filter(a => a.meta_id === metaId);
    const total = lista.reduce((s, a) => s + a.cantidad, 0);
    return { total, porcentaje: Math.min((total / objetivo) * 100, 100), completo: total >= objetivo, lista };
  };

  const metasFiltradas = metas.filter(m => {
    const coincideTexto = m.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCat = filtroCategoria === "Todas" || m.categoria === filtroCategoria;
    return coincideTexto && coincideCat;
  });

  const getColorPrioridad = (p) => {
    if (p === 'Urgente') return '#ff1744'; 
    if (p === 'Opcional') return '#00e676'; 
    return '#2979ff'; 
  };

  return (
    <ThemeProvider theme={theme}>
      {mostrarConfeti && <Confetti numberOfPieces={200} recycle={false} />}
      
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8 }}>
        
        {/* HEADER */}
        <Paper elevation={0} sx={{ bgcolor: 'background.paper', pt: 4, pb: 4, mb: 4, borderRadius: '0 0 30px 30px' }}>
          <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ bgcolor: 'primary.light', p: 1.5, borderRadius: '50%', color: 'white' }}><LunchDiningIcon fontSize="large" /></Box>
              <Box>
                {editandoConfig ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField value={nombreEvento} onChange={(e) => setNombreEvento(e.target.value)} variant="standard" placeholder="Nombre" autoFocus />
                    <TextField type="date" value={fechaEvento} onChange={(e) => setFechaEvento(e.target.value)} variant="standard" />
                    <Button size="small" onClick={guardarConfiguracion} variant="contained" startIcon={<LockIcon />}>Guardar (PIN)</Button>
                  </Box>
                ) : (
                  <Box onClick={() => setEditandoConfig(true)} sx={{ cursor: 'pointer' }}>
                    <Typography variant="h4" color="primary" fontWeight="bold">{nombreEvento} <EditIcon fontSize="small" sx={{ opacity: 0.5 }} /></Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonthIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">{fechaEvento || "Sin fecha"}</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={toggleTema}>{modoOscuro ? <LightModeIcon /> : <DarkModeIcon />}</IconButton>
              {/* BOTONES DE ACCIÓN */}
              <Button startIcon={<ContentCopyIcon />} variant="contained" color="secondary" onClick={copiarListaWhatsApp} sx={{ color: 'white' }}>Lista</Button>
              <Button startIcon={<ShareIcon />} variant="outlined" onClick={compartirWhatsApp}>Invitar</Button>
            </Box>
          </Container>
        </Paper>

        <Container maxWidth="lg">
          <Grid container spacing={4}>
            
            {/* PANEL IZQUIERDO */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, position: 'sticky', top: 20, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AddCircleOutlineIcon color="primary" /> Nueva Meta
                </Typography>
                <form onSubmit={crearMeta}>
                  <TextField fullWidth label="¿Qué hace falta?" value={nuevaMeta.nombre} onChange={(e) => setNuevaMeta({...nuevaMeta, nombre: e.target.value})} margin="dense" size="small" />
                  <TextField fullWidth type="number" label="Cantidad" value={nuevaMeta.objetivo} onChange={(e) => setNuevaMeta({...nuevaMeta, objetivo: e.target.value})} margin="dense" size="small" />
                  
                  <Grid container spacing={1} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Categoría</InputLabel>
                        <Select value={nuevaMeta.categoria} label="Categoría" onChange={(e) => setNuevaMeta({...nuevaMeta, categoria: e.target.value})}>
                          <MenuItem value="Comida">Comida</MenuItem>
                          <MenuItem value="Bebidas">Bebidas</MenuItem>
                          <MenuItem value="Decoración">Decoración</MenuItem>
                          <MenuItem value="Utensilios">Utensilios</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                       <FormControl fullWidth size="small">
                        <InputLabel>Prioridad</InputLabel>
                        <Select value={nuevaMeta.prioridad} label="Prioridad" onChange={(e) => setNuevaMeta({...nuevaMeta, prioridad: e.target.value})}>
                          <MenuItem value="Urgente">Urgente</MenuItem>
                          <MenuItem value="Normal">Normal</MenuItem>
                          <MenuItem value="Opcional">Opcional</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }}>Agregar</Button>
                </form>
                
                <Box sx={{ mt: 4, pt: 2, borderTop: '1px dashed #ccc', textAlign: 'center' }}>
                    <Button color="error" size="small" startIcon={<SecurityIcon />} onClick={reiniciarTodo}>Resetear Evento (PIN)</Button>
                </Box>
              </Paper>
            </Grid>

            {/* PANEL DERECHO */}
            <Grid item xs={12} md={8}>
              
              {metas.length > 0 && (
                  <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><BarChartIcon fontSize="small"/> Progreso del Evento</Typography>
                      <Box sx={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={dataGrafico} cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value" label>
                                    {dataGrafico.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORES_GRAFICO[index % COLORES_GRAFICO.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="middle" align="right" layout="vertical" />
                            </PieChart>
                        </ResponsiveContainer>
                      </Box>
                  </Paper>
              )}

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField 
                  fullWidth placeholder="Buscar..." size="small" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                  sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
                />
                <FormControl size="small" sx={{ minWidth: 120, bgcolor: 'background.paper', borderRadius: 2 }}>
                  <Select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} displayEmpty>
                    <MenuItem value="Todas">Todas</MenuItem>
                    <MenuItem value="Comida">Comida</MenuItem>
                    <MenuItem value="Bebidas">Bebidas</MenuItem>
                    <MenuItem value="Decoración">Decoración</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {metasFiltradas.length === 0 ? (
                <Box textAlign="center" py={5} opacity={0.5}><FilterListIcon fontSize="large" /><Typography>No hay resultados</Typography></Box>
              ) : (
                metasFiltradas.map((meta) => {
                  const { total, porcentaje, completo, lista } = getProgreso(meta.id, meta.objetivo);
                  return (
                    <Fade in={true} key={meta.id}>
                      <Card sx={{ mb: 2, borderLeft: `5px solid ${getColorPrioridad(meta.prioridad)}` }}>
                        <Box sx={{ p: 2, bgcolor: completo ? 'action.hover' : 'background.paper' }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="h6" sx={{ textDecoration: completo ? 'line-through' : 'none' }}>
                                {meta.nombre}
                              </Typography>
                              <Box display="flex" gap={1} mt={0.5}>
                                <Chip label={meta.categoria} size="small" variant="outlined" />
                                <Chip label={meta.prioridad} size="small" sx={{ bgcolor: getColorPrioridad(meta.prioridad), color: 'white', fontSize: '0.7rem' }} />
                              </Box>
                            </Box>
                            <Box textAlign="right">
                               <Typography variant="h5" color={completo ? 'success.main' : 'primary'}>{total}/{meta.objetivo}</Typography>
                               <IconButton size="small" onClick={() => eliminarMeta(meta.id)} color="error"><DeleteOutlineIcon /></IconButton>
                            </Box>
                          </Box>
                          <LinearProgress variant="determinate" value={porcentaje} sx={{ mt: 2, height: 8, borderRadius: 5 }} color={completo ? "success" : "primary"} />
                        </Box>

                        <CardContent sx={{ bgcolor: 'background.default', py: 1 }}>
                          {lista.map(ap => (
                            <Box key={ap.id} display="flex" alignItems="center" justifyContent="space-between" py={0.5}>
                              <Box display="flex" alignItems="center">
                                <Checkbox checked={ap.estado} size="small" onChange={async () => { await api.put(`/aportes/${ap.id}`, {estado: !ap.estado}); recargarDatos(); }} />
                                <Typography variant="body2" sx={{ textDecoration: ap.estado ? 'line-through' : 'none' }}>{ap.encargado} ({ap.cantidad})</Typography>
                              </Box>
                              <Box>
                                <IconButton size="small" onClick={() => { setMetaSeleccionada(meta); setAporteEditandoId(ap.id); setNuevoAporte({encargado: ap.encargado, cantidad: ap.cantidad}); setModalAbierto(true); }}><EditOutlinedIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => eliminarAporte(ap.id)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                              </Box>
                            </Box>
                          ))}
                          {!completo && (
                            <Button startIcon={<AddCircleOutlineIcon />} size="small" onClick={() => { setMetaSeleccionada(meta); setAporteEditandoId(null); setNuevoAporte({encargado:'', cantidad:''}); setModalAbierto(true); }}>
                              Aportar
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </Fade>
                  );
                })
              )}
            </Grid>
          </Grid>
        </Container>

        {/* MODAL APORTAR */}
        <Dialog open={modalAbierto} onClose={() => setModalAbierto(false)}>
          <DialogTitle>Agregar Aporte</DialogTitle>
          <DialogContent>
            <TextField autoFocus margin="dense" label="Nombre" fullWidth value={nuevoAporte.encargado} onChange={(e) => setNuevoAporte({...nuevoAporte, encargado: e.target.value})} />
            <TextField margin="dense" label="Cantidad" type="number" fullWidth value={nuevoAporte.cantidad} onChange={(e) => setNuevoAporte({...nuevoAporte, cantidad: e.target.value})} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalAbierto(false)}>Cancelar</Button>
            <Button onClick={guardarAporte} variant="contained">Guardar</Button>
          </DialogActions>
        </Dialog>

        {/* MODAL PIN */}
        <Dialog open={modalSeguridad} onClose={() => setModalSeguridad(false)}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="error" /> Seguridad Requerida
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Esta es una acción destructiva o de configuración. Por favor, ingresa el PIN maestro.
                </DialogContentText>
                <TextField 
                    autoFocus margin="dense" label="PIN de Seguridad" type="password" fullWidth variant="outlined" 
                    value={pinIngresado} onChange={(e) => setPinIngresado(e.target.value)} onKeyPress={(e) => { if(e.key === 'Enter') verificarPin(); }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setModalSeguridad(false)}>Cancelar</Button>
                <Button onClick={verificarPin} variant="contained" color="primary">Verificar</Button>
            </DialogActions>
        </Dialog>

        {/* TOASTS */}
        <Snackbar open={toast.open} autoHideDuration={4000} onClose={cerrarToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={cerrarToast} severity={toast.type} sx={{ width: '100%' }}>{toast.msg}</Alert>
        </Snackbar>

      </Box>
    </ThemeProvider>
  );
}

export default App;