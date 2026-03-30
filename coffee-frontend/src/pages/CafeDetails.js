import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    Box, Container, Typography, Grid, Paper, Card, CardContent, CardMedia,
    IconButton, Button, Chip, Stack, Divider, Drawer, List, ListItem, ListItemText, ListItemIcon,
    Tabs, Tab, Dialog, DialogTitle, DialogContent,
    Fab, Badge, TextField, MenuItem, Alert, CircularProgress, Snackbar
} from "@mui/material";
import { NavigateBefore, NavigateNext, Fastfood, TableRestaurant, Add, Remove, Close, ArrowBack, ShoppingCart, Event, AccessTime, Person, Phone, Dashboard, Image, CheckCircle } from "@mui/icons-material";

const BASE = "http://localhost:5005";

const resolveSrc = (p) => {
    if (!p) return '';
    const trimmed = String(p).trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : `${BASE}/${trimmed.replace(/^\/+/, '')}`;
};

const ImageCarousel = ({ paths, height = 220 }) => {
    const list = Array.isArray(paths) ? paths : (typeof paths === "string" ? paths.split(",").filter(Boolean) : []);
    const [index, setIndex] = React.useState(0);
    if (list.length === 0) return null;
    const next = () => setIndex((index + 1) % list.length);
    const prev = () => setIndex((index - 1 + list.length) % list.length);
    return (
        <Box sx={{ position: "relative", width: "100%", height, overflow: "hidden", borderRadius: 3 }}>
            <img alt="" src={resolveSrc(list[index])} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            {list.length > 1 && (
                <>
                    <IconButton size="small" onClick={prev} sx={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(255,255,255,0.6)" }}>
                        <NavigateBefore />
                    </IconButton>
                    <IconButton size="small" onClick={next} sx={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(255,255,255,0.6)" }}>
                        <NavigateNext />
                    </IconButton>
                </>
            )}
            <Box sx={{ position: "absolute", bottom: 6, right: 6, bgcolor: "rgba(0,0,0,0.5)", color: "white", px: 0.6, py: 0.2, borderRadius: 1, fontSize: "0.65rem" }}>
                {index + 1}/{list.length}
            </Box>
        </Box>
    );
};

const TableThumbs = ({ paths, style }) => {
    const list = Array.isArray(paths) ? paths : (typeof paths === "string" ? paths.split(",").filter(Boolean) : []);
    const [index, setIndex] = React.useState(0);
    if (list.length === 0) {
        return (
            <Box sx={{ width: "100%", height: "100%", bgcolor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, ...style }}>
                <TableRestaurant sx={{ color: "#ccc" }} />
            </Box>
        );
    }
    const next = (e) => { e.stopPropagation(); setIndex((index + 1) % list.length); };
    const prev = (e) => { e.stopPropagation(); setIndex((index - 1 + list.length) % list.length); };
    return (
        <Box sx={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", flexShrink: 0, ...style }}>
            <img alt="" src={resolveSrc(list[index])} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            {list.length > 1 && (
                <>
                    <IconButton size="small" onClick={prev} sx={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(255,255,255,0.5)" }}>
                        <NavigateBefore fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={next} sx={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(255,255,255,0.5)" }}>
                        <NavigateNext fontSize="small" />
                    </IconButton>
                </>
            )}
        </Box>
    );
};

const MenuItemCard = ({ item, onClick, onAdd }) => {
    const img = item.imagePaths?.[0];
    return (
        <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", cursor: "pointer", height: "100%", width: "100%", display: 'flex', flexDirection: 'column', transition: 'transform 0.15s ease, box-shadow 0.2s ease', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(0,0,0,0.08)' }, position: 'relative' }}>
            <Box sx={{ width: "100%", height: 140, bgcolor: "#f5f5f5", flexShrink: 0 }} onClick={() => onClick(item)}>
                {img ? (
                    <CardMedia component="img" height="140" image={resolveSrc(img)} alt={item.name} sx={{ objectFit: "cover" }} />
                ) : (
                    <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Fastfood sx={{ color: "#ccc" }} />
                    </Box>
                )}
            </Box>
            <CardContent sx={{ p: 1.5, display: 'flex', flexDirection: 'column', flexGrow: 1 }} onClick={() => onClick(item)}>
                <Box>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontWeight: 700,
                            lineHeight: 1.2,
                            height: 44,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}
                    >
                        {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', height: 20 }}>
                        {item.category}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto', pt: 1 }}>
                    <Typography sx={{ fontWeight: 800, color: "var(--color-primary)" }}>₹{item.price}</Typography>
                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onAdd(item); }}
                        sx={{
                            bgcolor: 'var(--color-primary)',
                            color: 'white',
                            width: 28,
                            height: 28,
                            '&:hover': { bgcolor: '#2C1E19', transform: 'scale(1.1)' },
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(60,42,33,0.25)'
                        }}
                    >
                        <Add sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    );
};

function CafeDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = React.useState(true);
    const [cafe, setCafe] = React.useState(null);
    const [cart, setCart] = React.useState([]);
    const [selectedItem, setSelectedItem] = React.useState(null);
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [tableViewerOpen, setTableViewerOpen] = React.useState(false);
    const [tableViewerImages, setTableViewerImages] = React.useState([]);
    const [cartDrawerOpen, setCartDrawerOpen] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [reorderSnackbar, setReorderSnackbar] = React.useState(false);

    const DRAWER_WIDTH = 260;
    const [activeSection, setActiveSection] = React.useState('menu');

    // Booking Form State
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [formData, setFormData] = React.useState({
        tableId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '12:00',
        customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        customerPhone: user.phone || ''
    });
    const [bookingLoading, setBookingLoading] = React.useState(false);
    const [bookingError, setBookingError] = React.useState('');
    const [bookingSuccess, setBookingSuccess] = React.useState(false);
    const [showBypass, setShowBypass] = React.useState(false);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const addToCart = (item) => {
        setCart((prev) => {
            const ex = prev.find((p) => p.id === item.id);
            if (ex) return prev.map((p) => p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
            return [...prev, { id: item.id, name: item.name, price: item.price || 0, quantity: 1 }];
        });
    };
    const decFromCart = (itemId) => {
        setCart((prev) => {
            const ex = prev.find((p) => p.id === itemId);
            if (!ex) return prev;
            if (ex.quantity <= 1) return prev.filter((p) => p.id !== itemId);
            return prev.map((p) => p.id === itemId ? { ...p, quantity: p.quantity - 1 } : p);
        });
    };

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE}/api/cafes/${id}/details`);
            if (res.ok) {
                const data = await res.json();
                setCafe(data);

                // If navigated via Reorder, pre-fill cart by matching item names
                const reorderCart = location.state?.reorderCart;
                if (reorderCart && reorderCart.length > 0 && data.menu) {
                    const preCart = [];
                    reorderCart.forEach((ri) => {
                        const menuItem = data.menu.find((m) => m.name === ri.name);
                        if (menuItem) {
                            preCart.push({
                                id: menuItem.id,
                                name: menuItem.name,
                                price: menuItem.price || 0,
                                quantity: ri.quantity || 1,
                            });
                        } else {
                            // Item no longer on menu — skip
                        }
                    });
                    if (preCart.length > 0) {
                        setCart(preCart);
                        setReorderSnackbar(true);
                    }
                    // Clear state so refresh doesn't re-trigger
                    window.history.replaceState({}, '');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { fetchDetails(); }, [id]);

    const itemsAmount = cart.reduce((sum, it) => sum + (it.price || 0) * it.quantity, 0);
    const totalItems = cart.reduce((s, c) => s + c.quantity, 0);

    const handleBooking = async (e, bypass = false) => {
        if (e) e.preventDefault();
        setBookingLoading(true);
        setBookingError('');
        setShowBypass(false);

        try {
            if (bypass) {
                // Skip Razorpay and go straight to prebook/success for testing
                await finalizeOrder({ id: "mock_rp_order_" + Date.now() }, "mock_payment_id_" + Date.now(), "mock_sig");
                return;
            }

            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                setBookingError('Razorpay SDK failed to load. Are you online?');
                setBookingLoading(false);
                return;
            }

            const selectedTableObj = (cafe?.tables || []).find(t => String(t.id) === String(formData.tableId));
            const tableAmount = selectedTableObj ? (selectedTableObj.price || 0) : 0;
            const itemsAmount = cart.reduce((sum, it) => sum + ((it.price || 0) * it.quantity), 0);
            const totalAmount = itemsAmount + tableAmount;

            if (totalAmount <= 0) {
                setBookingError('Cart is empty and no table selected. Cannot proceed.');
                setBookingLoading(false);
                return;
            }

            // 1. Create Razorpay Order
            const rpRes = await fetch(`${BASE}/api/payment/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: totalAmount })
            });

            if (!rpRes.ok) {
                const errorData = await rpRes.text();
                // We show bypass for ANY payment creation error in this dev phase to avoid blocking the user
                setShowBypass(true);
                throw new Error(errorData || 'Failed to create payment order');
            }
            const rpText = await rpRes.text();
            console.log("RP Order:", rpText);
            const razorpayOrder = JSON.parse(rpText);

            // 2. Prebook Cafe Order with the razorpay_order_id
            const payload = {
                ...formData,
                cafeId: cafe.id,
                userEmail: localStorage.getItem('userEmail') || user.email || '',
                payment: { razorpay_order_id: razorpayOrder.id },
                items: cart.map((it) => ({ menuItemId: it.id, quantity: it.quantity }))
            };

            const prebookRes = await fetch(`${BASE}/api/cafes/prebook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!prebookRes.ok) {
                const msg = await prebookRes.text();
                throw new Error(msg || 'Failed to initialize booking');
            }

            // 3. Open Razorpay Checkout Widget
            const options = {
                key: razorpayOrder.key_id || 'rzp_test_SQMtX9pLfcbNhR', // Use order key or fallbacktest key
                amount: razorpayOrder.amount,
                currency: 'INR',
                name: cafe?.name || 'Cafe',
                description: 'Order Payment',
                order_id: razorpayOrder.id,
                handler: async function (response) {
                    await finalizeOrder(response, response.razorpay_payment_id, response.razorpay_signature);
                },
                prefill: {
                    name: formData.customerName,
                    email: localStorage.getItem('userEmail') || user.email || '',
                    contact: formData.customerPhone
                },
                theme: {
                    color: '#2C1E19'
                }
            };
            const rzpClient = new window.Razorpay(options);
            rzpClient.on('payment.failed', function (response) {
                setBookingError('Payment failed: ' + response.error.description);
            });
            rzpClient.open();

        } catch (err) {
            console.error("Booking Error:", err);
            setShowBypass(true); // Allow bypass on ANY catch
            setBookingError(err.message || 'Error processing request');
        } finally {
            setBookingLoading(false);
        }
    };

    const finalizeOrder = async (rpResponse, paymentId, signature) => {
        try {
            const verifyRes = await fetch(`${BASE}/api/payment/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpay_order_id: rpResponse.razorpay_order_id || rpResponse.id,
                    razorpay_payment_id: paymentId,
                    razorpay_signature: signature
                })
            });

            if (verifyRes.ok) {
                setBookingSuccess(true);
                setShowSuccess(true);
                setCart([]);
                setFormData({
                    tableId: '',
                    date: new Date().toISOString().split('T')[0],
                    startTime: '12:00',
                    customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                    customerPhone: user.phone || ''
                });
                setTimeout(() => {
                    setShowSuccess(false);
                    setCartDrawerOpen(false);
                    navigate('/dashboard');
                }, 3000);
            } else {
                setBookingError('Payment verification failed.');
            }
        } catch (err) {
            setBookingError('Payment verification error.');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", display: 'flex' }}>
            <Drawer
                variant="permanent"
                PaperProps={{ sx: { width: DRAWER_WIDTH, bgcolor: "#2C1E19", color: "white", borderRight: "none" } }}
            >
                <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ mb: 4, mt: 2, px: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: "'Playfair Display', serif", color: "#d4a373" }}>
                            {cafe?.name || "Café"}
                        </Typography>
                    </Box>
                    <List sx={{ flexGrow: 1 }}>
                        <ListItem button onClick={() => navigate("/dashboard")} sx={{ mb: 1, borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                            <ListItemIcon sx={{ color: "white", minWidth: 40 }}><Dashboard /></ListItemIcon>
                            <ListItemText primary="Dashboard" primaryTypographyProps={{ fontWeight: 600 }} />
                        </ListItem>
                        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 2 }} />

                        {cafe?.interiorPhoto && cafe.interiorPhoto.trim() && (
                            <ListItem button onClick={() => setActiveSection('interior')} sx={{ mb: 1, borderRadius: 2, bgcolor: activeSection === 'interior' ? 'rgba(255,255,255,0.2)' : 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                                <ListItemIcon sx={{ color: "white", minWidth: 40 }}><Image /></ListItemIcon>
                                <ListItemText primary="Interior" />
                            </ListItem>
                        )}
                        <ListItem button onClick={() => setActiveSection('menu')} sx={{ mb: 1, borderRadius: 2, bgcolor: activeSection === 'menu' ? 'rgba(255,255,255,0.2)' : 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                            <ListItemIcon sx={{ color: "white", minWidth: 40 }}><Fastfood /></ListItemIcon>
                            <ListItemText primary="Menu" />
                        </ListItem>
                        <ListItem button onClick={() => setActiveSection('tables')} sx={{ mb: 1, borderRadius: 2, bgcolor: activeSection === 'tables' ? 'rgba(255,255,255,0.2)' : 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                            <ListItemIcon sx={{ color: "white", minWidth: 40 }}><TableRestaurant /></ListItemIcon>
                            <ListItemText primary="Tables" />
                        </ListItem>
                        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 2 }} />
                        <ListItem button onClick={() => navigate(-1)} sx={{ mb: 1, borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                            <ListItemIcon sx={{ color: "white", minWidth: 40 }}><ArrowBack /></ListItemIcon>
                            <ListItemText primary="Back" />
                        </ListItem>
                    </List>
                </Box>
            </Drawer>

            <Box sx={{ flexGrow: 1, ml: `${DRAWER_WIDTH}px`, width: `calc(100% - ${DRAWER_WIDTH}px)`, py: 4, px: { xs: 2, md: 4, lg: 5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: "var(--color-primary)", fontFamily: "'Playfair Display', serif" }}>
                        {cafe?.name || "Café"}
                    </Typography>
                </Box>

                <Box sx={{ width: '100%' }}>
                    {activeSection === 'interior' && cafe?.interiorPhoto && cafe.interiorPhoto.trim() && (
                        <Box sx={{ mb: 6 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, borderBottom: '2px solid #e0e0e0', pb: 1, fontFamily: "'Playfair Display', serif" }}>Interior</Typography>
                            <ImageCarousel paths={cafe.interiorPhoto} />
                        </Box>
                    )}

                    {activeSection === 'menu' && (
                        <Box sx={{ mb: 6, width: '100%' }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, color: '#3c2a21', fontFamily: "'Playfair Display', serif" }}>Menu</Typography>
                            {(cafe?.menu && cafe.menu.length > 0) ? (
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        sm: 'repeat(2, 1fr)',
                                        md: 'repeat(4, 1fr)'
                                    },
                                    gap: 3,
                                    alignItems: 'stretch',
                                    width: '100%'
                                }}>
                                    {cafe.menu.map((item) => (
                                        <MenuItemCard key={item.id} item={item} onClick={(it) => { setSelectedItem(it); setDrawerOpen(true); }} onAdd={(it) => { addToCart(it); }} />
                                    ))}
                                </Box>
                            ) : (
                                <Paper sx={{ p: 3, textAlign: "center", borderRadius: 3 }}>
                                    <Typography color="text.secondary">No menu items available.</Typography>
                                </Paper>
                            )}
                        </Box>
                    )}

                    {activeSection === 'tables' && (
                        <Box sx={{ mb: 6, width: '100%' }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, color: '#3c2a21', fontFamily: "'Playfair Display', serif" }}>Available Tables</Typography>
                            {(cafe?.tables?.length || 0) > 0 ? (
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        sm: 'repeat(2, 1fr)',
                                        md: 'repeat(4, 1fr)'
                                    },
                                    gap: 3,
                                    alignItems: 'stretch',
                                    width: '100%'
                                }}>
                                    {cafe.tables.map((table) => (
                                        <Card key={table.id} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", cursor: 'pointer', height: '100%', width: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.15s ease, box-shadow 0.2s ease', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(0,0,0,0.08)' } }}
                                            onClick={() => { setTableViewerImages(table.imagePaths || []); setTableViewerOpen(true); }}>
                                            <Box sx={{ width: "100%", height: 140, bgcolor: "#f5f5f5", flexShrink: 0, position: 'relative' }}>
                                                <TableThumbs paths={table.imagePaths} style={{ width: '100%', height: '100%' }} />
                                                <Chip
                                                    label={table.isAvailable ? "Available" : "Occupied"}
                                                    size="small"
                                                    color={table.isAvailable ? "success" : "default"}
                                                    sx={{ position: 'absolute', top: 8, right: 8, fontWeight: 700 }}
                                                />
                                            </Box>
                                            <CardContent sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{table.label}</Typography>
                                                <Typography variant="caption" color="text.secondary">Capacity: {table.capacity} | {table.type || "regular"}</Typography>
                                                <Box sx={{ mt: 'auto', pt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Typography sx={{ fontWeight: 800, color: "var(--color-primary)" }}>₹{table.price || 0}</Typography>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        disabled={!table.isAvailable}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFormData(prev => ({ ...prev, tableId: table.id }));
                                                            setCartDrawerOpen(true);
                                                        }}
                                                        sx={{ textTransform: "none", bgcolor: "var(--color-primary)", borderRadius: 1.5 }}
                                                    >
                                                        Select
                                                    </Button>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            ) : (
                                <Paper sx={{ p: 3, textAlign: "center", borderRadius: 3 }}>
                                    <Typography color="text.secondary">No available tables right now.</Typography>
                                </Paper>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>

            <Fab
                color="primary"
                aria-label="cart"
                onClick={() => setCartDrawerOpen(true)}
                sx={{ position: 'fixed', bottom: 32, right: 32, bgcolor: "var(--color-primary)", '&:hover': { bgcolor: '#2C1E19' }, zIndex: 1000 }}
            >
                <Badge badgeContent={totalItems} color="error">
                    <ShoppingCart />
                </Badge>
            </Fab>

            {/* Redesigned Cart Dialog (Horizontal Rectangle) */}
            <Dialog
                open={cartDrawerOpen}
                onClose={() => setCartDrawerOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
            >
                <DialogTitle sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'var(--color-primary)', color: 'white' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Confirm Your Reservation</Typography>
                    <IconButton onClick={() => setCartDrawerOpen(false)} sx={{ color: 'white' }}><Close /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <Grid container>
                        {/* Left Side: Cart Items */}
                        <Grid item xs={12} md={6} sx={{ p: 3, borderRight: { md: '1px solid #eee' }, bgcolor: '#fafafa' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ShoppingCart fontSize="small" /> Cart Items
                            </Typography>
                            {cart.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No menu items selected.</Typography>
                                </Box>
                            ) : (
                                <List sx={{ mb: 2 }}>
                                    {cart.map((it) => (
                                        <ListItem key={it.id} sx={{ px: 0, py: 1 }} secondaryAction={
                                            <Stack direction="row" alignItems="center" gap={0.5}>
                                                <IconButton size="small" onClick={() => decFromCart(it.id)}><Remove fontSize="small" /></IconButton>
                                                <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>{it.quantity}</Typography>
                                                <IconButton size="small" onClick={() => addToCart({ id: it.id, name: it.name, price: it.price })}><Add fontSize="small" /></IconButton>
                                            </Stack>
                                        }>
                                            <ListItemText
                                                primary={<Typography sx={{ fontWeight: 600 }}>{it.name}</Typography>}
                                                secondary={`₹${(it.price || 0).toFixed(2)} x ${it.quantity}`}
                                            />
                                            <Typography variant="body2" sx={{ fontWeight: 700, mr: 12 }}>
                                                ₹{((it.price || 0) * it.quantity).toFixed(2)}
                                            </Typography>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #eee' }}>
                                {(() => {
                                    const selectedTableObj = (cafe?.tables || []).find(t => String(t.id) === String(formData.tableId));
                                    const tableAmount = selectedTableObj ? (selectedTableObj.price || 0) : 0;
                                    const totalAmount = (cart.reduce((sum, it) => sum + (it.price * it.quantity), 0)) + tableAmount;
                                    return (
                                        <Stack spacing={1}>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">Items Total:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{(cart.reduce((sum, it) => sum + (it.price * it.quantity), 0)).toFixed(2)}</Typography>
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">Table Cost:</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{tableAmount.toFixed(2)}</Typography>
                                            </Stack>
                                            <Divider />
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>Grand Total:</Typography>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "var(--color-primary)" }}>₹{totalAmount.toFixed(2)}</Typography>
                                            </Stack>
                                        </Stack>
                                    );
                                })()}
                            </Box>
                        </Grid>

                        {/* Right Side: Booking Form */}
                        <Grid item xs={12} md={6} sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Event fontSize="small" /> Booking Details
                            </Typography>
                            {bookingError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {bookingError}
                                    {showBypass && (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            sx={{ ml: 2 }}
                                            onClick={() => handleBooking(null, true)}
                                        >
                                            Bypass Payment (Demo Mode)
                                        </Button>
                                    )}
                                </Alert>
                            )}
                            <form id="booking-form-dialog" onSubmit={(e) => handleBooking(e)}>
                                <Stack spacing={2}>
                                    <TextField select fullWidth size="small" label="Select Table (Optional)" value={formData.tableId} onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
                                        InputProps={{ startAdornment: <TableRestaurant sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}>
                                        <MenuItem value=""><em>None</em></MenuItem>
                                        {(cafe?.tables || []).filter(t => t.isAvailable).map(t => (
                                            <MenuItem key={t.id} value={t.id}>{t.label} (Cap: {t.capacity}) - ₹{t.price}</MenuItem>
                                        ))}
                                    </TextField>
                                    <Stack direction="row" spacing={2}>
                                        <TextField fullWidth size="small" type="date" label="Date" required InputLabelProps={{ shrink: true }} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            InputProps={{ startAdornment: <Event sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }} />
                                        <TextField fullWidth size="small" type="time" label="Time" required InputLabelProps={{ shrink: true }} value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                            InputProps={{ startAdornment: <AccessTime sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }} />
                                    </Stack>
                                    <TextField fullWidth size="small" label="Your Name" required value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                        InputProps={{ startAdornment: <Person sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }} />
                                    <TextField fullWidth size="small" label="Phone Number" required value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                        InputProps={{ startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }} />
                                </Stack>
                            </form>
                            <Box sx={{ mt: 4 }}>
                                <Button
                                    type="submit"
                                    form="booking-form-dialog"
                                    fullWidth
                                    variant="contained"
                                    disabled={bookingLoading}
                                    sx={{ py: 1.5, bgcolor: "var(--color-primary)", textTransform: "none", fontWeight: 800, fontSize: '1rem', borderRadius: 2 }}
                                >
                                    {bookingLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm and Pay'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
            </Dialog>

            {/* Success Animation Popup */}
            <Dialog open={showSuccess} PaperProps={{ sx: { borderRadius: 4, p: 4, textAlign: 'center', maxWidth: 400 } }}>
                <DialogContent>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <CheckCircle sx={{ fontSize: 100, color: '#4caf50' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: '#2C1E19' }}>Success!</Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                        Your reservation has been confirmed. Enjoy your delicious coffee!
                    </Typography>
                </DialogContent>
            </Dialog>

            {/* Redesigned Menu Item Dialog (Horizontal Rectangle) */}
            <Dialog
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
            >
                {selectedItem && (
                    <DialogContent sx={{ p: 0 }}>
                        <Grid container>
                            {/* Left Side: Image Gallery */}
                            <Grid item xs={12} md={5} sx={{ bgcolor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                                <Box sx={{ width: '100%', maxWidth: 350 }}>
                                    <ImageCarousel paths={selectedItem.imagePaths} height={280} />
                                </Box>
                            </Grid>

                            {/* Right Side: Item Details */}
                            <Grid item xs={12} md={7} sx={{ p: 4, display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#2C1E19' }}>{selectedItem.name}</Typography>
                                        <Chip label={selectedItem.category} size="small" sx={{ mt: 1, bgcolor: '#f0f0f0', fontWeight: 600 }} />
                                    </Box>
                                    <IconButton onClick={() => setDrawerOpen(false)}><Close /></IconButton>
                                </Box>

                                <Divider sx={{ mb: 3 }} />

                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 4 }}>
                                        {selectedItem.description || "No description available for this item."}
                                    </Typography>

                                    <Typography variant="h4" sx={{ fontWeight: 900, color: 'var(--color-primary)' }}>
                                        ₹{selectedItem.price}
                                    </Typography>
                                </Box>

                                <Box sx={{ mt: 4 }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        onClick={() => {
                                            addToCart(selectedItem);
                                            setDrawerOpen(false);
                                        }}
                                        sx={{
                                            bgcolor: "var(--color-primary)",
                                            textTransform: "none",
                                            fontWeight: 800,
                                            py: 1.5,
                                            borderRadius: 2,
                                            fontSize: '1.1rem',
                                            '&:hover': { bgcolor: '#2C1E19' }
                                        }}
                                    >
                                        Add to Cart
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </DialogContent>
                )}
            </Dialog>
            <Dialog open={tableViewerOpen} onClose={() => setTableViewerOpen(false)} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>Table Images</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{ width: '100%', maxWidth: 500 }}>
                            <ImageCarousel paths={tableViewerImages} height={300} />
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Reorder Success Snackbar */}
            <Snackbar
                open={reorderSnackbar}
                autoHideDuration={4000}
                onClose={() => setReorderSnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setReorderSnackbar(false)}
                    severity="success"
                    variant="filled"
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                >
                    Previous order items added to your cart!
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default CafeDetails;
