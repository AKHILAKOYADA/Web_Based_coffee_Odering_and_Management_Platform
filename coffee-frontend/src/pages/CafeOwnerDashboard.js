import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, Chip, CircularProgress,
    Alert, Grid, Drawer, List, ListItem, ListItemIcon,
    ListItemText, TextField, Card, CardContent, Avatar,
    Stack, Select, MenuItem, FormControl, InputLabel,
    IconButton, Tooltip, Checkbox, FormControlLabel, Divider,
    Stepper, Step, StepLabel, Pagination, InputAdornment,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
    Logout, Dashboard, PersonAdd, Group, Person,
    Restaurant, LocalDining, CheckCircle, Cancel,
    Delete, ToggleOn, ToggleOff, Coffee,
    DirectionsCar, Wifi, AcUnit, DeliveryDining,
    TakeoutDining, CloudUpload, PhotoLibrary, AddCircle,
    Search, Email, Phone, Cake, Wc, Work, Home, LocationCity,
    Map, PinDrop, ArrowBackIosNew, TableRestaurant,
    NavigateBefore, NavigateNext, Edit, DeleteForever, Receipt,
    CalendarMonth, LocationOn, InsertDriveFile
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const DRAWER_WIDTH = 270;

const COLORS = ['#3c2a21', '#7f5539', '#d4a373', '#e6ccb2', '#fcfaf7'];

const ROLE_STYLES = {
    chef: { color: '#5D4037', bg: '#EFEBE9', label: 'Chef', icon: <Restaurant sx={{ fontSize: 18 }} /> },
    waiter: { color: '#1565C0', bg: '#E3F2FD', label: 'Waiter', icon: <LocalDining sx={{ fontSize: 18 }} /> },
};

const BASE = 'http://localhost:5005';

export const resolveSrc = (p) => {
    if (!p) return '';
    const trimmed = String(p).trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : `${BASE}/${trimmed.replace(/^\/+/, '')}`;
};

function CafeOwnerDashboard() {
    const [userData, setUserData] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [activeTab, setActiveTab] = useState('overview');
    const [staff, setStaff] = useState([]);
    const [tables, setTables] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [tableStats, setTableStats] = useState(null);
    const [menu, setMenu] = useState([]);
    const [summary, setSummary] = useState(null);
    const [lowStock, setLowStock] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [profileForm, setProfileForm] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        dob: '', gender: '', plotNo: '', street: '',
        city: '', pincode: ''
    });

    // Add-staff form state
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', role: 'waiter',
        dob: '', gender: '',
        plotNo: '', street: '', landmark: '', city: '', pincode: '',
        phone: '', address: ''
    });
    const [cafeForm, setCafeForm] = useState({
        cafeName: '', ownerName: '', contactNumber: '', email: '', password: '',
        openingTime: '', closingTime: '',
        street: '', city: '', state: '', pincode: '',
        businessType: '', fssaiLicenseNumber: '', gstNumber: '',
        accountHolderName: '', accountNumber: '', ifscCode: '', upiId: '',
        hasHomeDelivery: false, hasTakeaway: false, hasDineIn: false,
        totalTables: '', seatingCapacity: '',
        parkingAvailable: false, freeWifi: false, airConditioned: false
    });
    const [cafeMeta, setCafeMeta] = useState({
        exists: false, registrationDate: '', status: '', verificationStatus: '',
        cafeLogo: '', exteriorPhoto: '', interiorPhoto: '', menuFile: '', foodPhotos: ''
    });
    const [cafeStep, setCafeStep] = useState(0);

    const [menuSearch, setMenuSearch] = useState('');
    const [menuFilter, setMenuFilter] = useState('all');
    const [menuPage, setMenuPage] = useState(1);
    const [menuImages, setMenuImages] = useState([]); // For multiple images during add
    const itemsPerPage = 8;

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const authHdr = { Authorization: `Bearer ${token}` };

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${BASE}/api/profile`, {
                headers: authHdr
            });
            if (res.ok) {
                const data = await res.json();
                setUserData(data);
                localStorage.setItem('user', JSON.stringify(data));
                setProfileForm({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    dob: data.dob || '',
                    gender: data.gender || '',
                    plotNo: data.plotNo || '',
                    street: data.street || '',
                    city: data.city || '',
                    pincode: data.pincode || ''
                });
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        }
    };

    useEffect(() => {
        fetchStaff();
        fetchCafe();
        fetchProfile();
    }, []);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await fetch(`${BASE}/api/profile`, {
                method: 'PUT',
                headers: { ...authHdr, 'Content-Type': 'application/json' },
                body: JSON.stringify(profileForm)
            });
            const data = await res.json();
            if (res.ok) {
                setSuccessMsg('Profile updated successfully!');
                await fetchProfile();
                setIsEditing(false);
            } else {
                throw new Error(data.message || 'Update failed');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const fetchTables = async () => {
        try {
            const res = await fetch(`${BASE}/api/cafe-owner/tables`, { headers: authHdr });
            if (res.ok) {
                const raw = await res.json();
                const list = Array.isArray(raw) ? raw : [];
                const normalized = list.map(t => {
                    const candidates = [
                        t.imagePaths, t.images, t.photos, t.tableImages, t.image_url_list,
                        t.imagePath, t.photoPath, t.image, t.img, t.picture
                    ];
                    let paths = [];
                    for (const c of candidates) {
                        if (!c) continue;
                        if (Array.isArray(c) && c.length) { paths = c; break; }
                        if (typeof c === 'string' && c.length) { paths = c.split(',').filter(Boolean); break; }
                    }
                    return { ...t, imagePaths: paths };
                });
                setTables(normalized);
            }
            const rs = await fetch(`${BASE}/api/cafe-owner/tables/stats`, { headers: authHdr });
            if (rs.ok) setTableStats(await rs.json());
        } catch (err) {
            console.error('Fetch tables error:', err);
        }
    };

    const fetchMenu = async () => {
        try {
            const res = await fetch(`${BASE}/api/cafe-owner/menu`, { headers: authHdr });
            if (res.ok) {
                const data = await res.json();
                setMenu(Array.isArray(data) ? data : []);
            } else {
                setError(`Failed to fetch menu: ${res.status}`);
            }
        } catch (err) {
            setError(`Error connecting to menu service: ${err.message}`);
        }
    };

    const fetchReservations = async () => {
        try {
            const res = await fetch(`${BASE}/api/cafe-owner/reservations`, { headers: authHdr });
            if (res.ok) setReservations(await res.json());
        } catch { }
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${BASE}/api/cafe-owner/orders`, { headers: authHdr });
            if (res.ok) {
                const data = await res.json();
                setOrders(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Fetch orders error:', err);
        }
    };

    useEffect(() => {
        if (activeTab === 'tables') fetchTables();
        if (activeTab === 'menu') fetchMenu();
        if (activeTab === 'reservations') fetchReservations();
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'overview') {
            (async () => {
                try {
                    const s = await fetch(`${BASE}/api/cafe-owner/dashboard/summary`, { headers: authHdr });
                    if (s.ok) setSummary(await s.json());
                } catch { }
                try {
                    const l = await fetch(`${BASE}/api/cafe-owner/inventory/low-stock`, { headers: authHdr });
                    if (l.ok) setLowStock(await l.json());
                } catch { }
            })();
        }
    }, [activeTab]);

    const [newTable, setNewTable] = useState({ label: '', tableNo: '', capacity: '', type: 'regular', price: '', pricePerHour: '', isAvailable: true });
    const [newTableImages, setNewTableImages] = useState([]);
    const [addTableDialogOpen, setAddTableDialogOpen] = useState(false);
    const addTable = async (e) => {
        e.preventDefault();
        setActionLoading(true); setError(''); setSuccessMsg('');
        try {
            if (!newTable.label || !newTable.tableNo || !newTable.pricePerHour || !newTable.type) {
                throw new Error('Please fill table name, table no, cost/hour and occasion');
            }
            const payload = {
                label: newTable.label,
                tableNo: newTable.tableNo,
                capacity: newTable.capacity,
                type: newTable.type === 'casual' ? 'regular' : newTable.type,
                price: newTable.price ? newTable.price : (newTable.pricePerHour || 0),
                pricePerHour: newTable.pricePerHour,
                isAvailable: newTable.isAvailable
            };
            const res = await fetch(`${BASE}/api/cafe-owner/tables`, {
                method: 'POST', headers: { ...authHdr, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            let data = {};
            try { data = await res.json(); } catch { }
            if (!res.ok) throw new Error(data.message || 'Failed to add table');
            setSuccessMsg('Table added');
            const newId = data.id || data.tableId || data.insertId;
            if (newTableImages.length > 0 && newId) {
                const fd = new FormData();
                newTableImages.forEach(f => fd.append('files', f));
                try {
                    const up = await fetch(`${BASE}/api/cafe-owner/tables/${newId}/images`, { method: 'POST', headers: authHdr, body: fd });
                    let upData = {};
                    try { upData = await up.json(); } catch { }
                    if (!up.ok) throw new Error(upData.message || 'Image upload failed');
                } catch { }
            }
            setNewTable({ label: '', tableNo: '', capacity: '', type: 'regular', price: '', pricePerHour: '', isAvailable: true });
            setNewTableImages([]);
            setAddTableDialogOpen(false);
            fetchTables();
        } catch (e) { setError(e.message); } finally { setActionLoading(false); }
    };

    const removeTable = async (id) => {
        setActionLoading(true);
        try {
            await fetch(`${BASE}/api/cafe-owner/tables/${id}`, { method: 'DELETE', headers: authHdr });
            fetchTables();
        } finally { setActionLoading(false); }
    };

    const [newItem, setNewItem] = useState({ name: '', description: '', category: '', price: '', isVeg: true, available: true });
    const [newItemImages, setNewItemImages] = useState([]);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const addMenuItem = async (e) => {
        e.preventDefault();
        setActionLoading(true); setError(''); setSuccessMsg('');
        try {
            const body = {
                ...newItem,
                price: newItem.price || '0', // Ensure price is sent
                category: newItem.category || 'Other' // Ensure category is sent
            };
            const res = await fetch(`${BASE}/api/cafe-owner/menu`, {
                method: 'POST', headers: { ...authHdr, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok || data.success !== true) throw new Error(data.message || 'Failed to add item');

            if (newItemImages.length > 0) {
                const fd = new FormData();
                newItemImages.forEach(f => fd.append('files', f));
                const up = await fetch(`${BASE}/api/cafe-owner/menu/${data.id}/images`, { method: 'POST', headers: authHdr, body: fd });
                const upData = await up.json();
                if (!up.ok || upData.success !== true) throw new Error(upData.message || 'Image upload failed');
            }

            setSuccessMsg('Menu item added');
            setNewItem({ name: '', description: '', category: '', price: '', isVeg: true, available: true });
            setNewItemImages([]);
            setAddDialogOpen(false);
            setMenuPage(1);
            await fetchMenu();
        } catch (e) {
            console.error('Add menu item error:', e);
            setError(e.message || 'Failed to add menu item. Please check your connection.');
        } finally {
            setActionLoading(false);
        }
    };

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const updateMenuItem = async (e) => {
        e.preventDefault();
        setActionLoading(true); setError(''); setSuccessMsg('');
        try {
            const body = {
                ...editingItem,
                price: editingItem.price || '0',
                category: editingItem.category || 'Other'
            };
            const res = await fetch(`${BASE}/api/cafe-owner/menu/${editingItem.id}`, {
                method: 'PUT', headers: { ...authHdr, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok || data.success !== true) throw new Error(data.message || 'Failed to update item');

            setSuccessMsg('Menu item updated');
            setEditDialogOpen(false);
            setEditingItem(null);
            await fetchMenu();
        } catch (e) {
            console.error('Update menu item error:', e);
            setError(e.message || 'Failed to update menu item.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditClick = (item) => {
        setEditingItem({ ...item });
        setEditDialogOpen(true);
    };

    const removeMenuItem = async (id) => {
        setActionLoading(true);
        try {
            await fetch(`${BASE}/api/cafe-owner/menu/${id}`, { method: 'DELETE', headers: authHdr });
            fetchMenu();
        } finally { setActionLoading(false); }
    };

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE}/api/cafe-owner/my-staff`, { headers: authHdr });
            if (!res.ok) {
                let msg = `Failed to load staff (${res.status})`;
                try {
                    const data = await res.json();
                    if (data?.message) msg = data.message;
                } catch { }
                throw new Error(msg);
            }
            const data = await res.json();
            setStaff(data);
            setError('');
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError(''); setSuccessMsg('');
        try {
            if (!form.firstName || !form.lastName || !form.email || !form.role ||
                !form.dob || !form.gender || !form.street || !form.city || !form.pincode) {
                throw new Error('Please fill all required fields.');
            }
            const res = await fetch(`${BASE}/api/cafe-owner/add-staff`, {
                method: 'POST',
                headers: { ...authHdr, 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to add staff');
            setSuccessMsg(`${form.firstName} added successfully! Credentials have been emailed.`);
            setForm({
                firstName: '', lastName: '', email: '', role: 'waiter',
                dob: '', gender: '',
                plotNo: '', street: '', landmark: '', city: '', pincode: '',
                phone: '', address: ''
            });
            fetchStaff();
            setTimeout(() => setActiveTab('staff'), 1000);
        } catch (e) {
            setError(e.message);
        } finally {
            setActionLoading(false);
        }
    };

    const fetchCafe = async () => {
        try {
            const res = await fetch(`${BASE}/api/cafe-owner/my-cafe`, { headers: authHdr });
            if (!res.ok) {
                if (res.status === 403) setError('Access denied — not a café owner');
                else setError(`Failed to load café (${res.status})`);
                return;
            }
            const data = await res.json();
            if (data.exists) {
                setCafeForm({
                    cafeName: data.cafeName || '',
                    ownerName: data.ownerName || '',
                    contactNumber: data.contactNumber || '',
                    email: data.email || '',
                    password: '',
                    openingTime: data.openingTime || '',
                    closingTime: data.closingTime || '',
                    street: data.street || '',
                    city: data.city || '',
                    state: data.state || '',
                    pincode: data.pincode || '',
                    businessType: data.businessType || '',
                    fssaiLicenseNumber: data.fssaiLicenseNumber || '',
                    gstNumber: data.gstNumber || '',
                    accountHolderName: data.accountHolderName || '',
                    accountNumber: data.accountNumber || '',
                    ifscCode: data.ifscCode || '',
                    upiId: data.upiId || '',
                    hasHomeDelivery: !!data.hasHomeDelivery,
                    hasTakeaway: !!data.hasTakeaway,
                    hasDineIn: !!data.hasDineIn,
                    totalTables: data.totalTables || '',
                    seatingCapacity: data.seatingCapacity || '',
                    parkingAvailable: !!data.parkingAvailable,
                    freeWifi: !!data.freeWifi,
                    airConditioned: !!data.airConditioned
                });
                setCafeMeta({
                    exists: true,
                    registrationDate: data.registrationDate || '',
                    status: data.status || '',
                    verificationStatus: data.verificationStatus || '',
                    cafeLogo: data.cafeLogo || '',
                    exteriorPhoto: data.exteriorPhoto || '',
                    interiorPhoto: data.interiorPhoto || '',
                    menuFile: data.menuFile || '',
                    foodPhotos: data.foodPhotos || ''
                });
            } else {
                setError('');
            }
        } catch (e) {
            setError(e.message || 'Failed to fetch');
        }
    };

    const handleSaveCafe = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError(''); setSuccessMsg('');
        try {
            const res = await fetch(`${BASE}/api/cafe-owner/register-cafe`, {
                method: 'POST',
                headers: { ...authHdr, 'Content-Type': 'application/json' },
                body: JSON.stringify(cafeForm)
            });
            const data = await res.json();
            if (!res.ok || data.success !== true) throw new Error(data.message || 'Failed to save cafe');
            setSuccessMsg('Café details saved successfully');
            await fetchCafe();
            setCafeStep(5);
        } catch (e) {
            setError(e.message);
        } finally {
            setActionLoading(false);
        }
    };

    const validateBasic = () => {
        const f = cafeForm;
        if (!f.cafeName || !f.ownerName || !f.contactNumber || !f.email || !f.openingTime || !f.closingTime) {
            setError('Please fill all basic information fields');
            return false;
        }
        return true;
    };

    const validateAddress = () => {
        const f = cafeForm;
        if (!f.street || !f.city || !f.state || !f.pincode) {
            setError('Please fill all address fields');
            return false;
        }
        return true;
    };
    const validateBusiness = () => {
        const f = cafeForm;
        if (!f.businessType || !f.fssaiLicenseNumber) {
            setError('Please fill business type and FSSAI license');
            return false;
        }
        return true;
    };

    const uploadCafeFile = async (type, input) => {
        const files = input?.files;
        if (!files || files.length === 0) return;
        if (!cafeMeta.exists) { setError('Please register the café first'); return; }
        setActionLoading(true);
        setError(''); setSuccessMsg('');
        try {
            const fd = new FormData();
            fd.append('type', type);
            if (type === 'food' || type === 'exterior' || type === 'interior') {
                Array.from(files).forEach(f => fd.append('files', f));
            } else {
                fd.append('file', files[0]);
            }
            const res = await fetch(`${BASE}/api/cafe-owner/upload-cafe-photo`, { method: 'POST', headers: authHdr, body: fd });
            const data = await res.json();
            if (!res.ok || data.success !== true) throw new Error(data.message || 'Upload failed');
            setSuccessMsg('Uploaded successfully');
            fetchCafe();
        } catch (e) {
            setError(e.message);
        } finally {
            setActionLoading(false);
            if (input) input.value = '';
        }
    };

    const removeCafePhoto = async (type, path) => {
        if (!window.confirm('Delete this photo?')) return;
        setActionLoading(true);
        try {
            const res = await fetch(`${BASE}/api/cafe-owner/remove-cafe-photo?type=${type}&path=${encodeURIComponent(path)}`, {
                method: 'DELETE', headers: authHdr
            });
            if (res.ok) {
                setSuccessMsg('Photo removed');
                fetchCafe();
            }
        } catch (err) { setError('Failed to remove photo'); }
        finally { setActionLoading(false); }
    };
    const uploadCafeFileDirect = async (type, fileList) => {
        if (!fileList || fileList.length === 0) return;
        const max = 5 * 1024 * 1024;
        for (let i = 0; i < fileList.length; i++) {
            if (fileList[i].size > max) {
                setError('Max 5MB per file');
                return;
            }
        }
        if (!cafeMeta.exists) { setError('Please register the café first'); return; }
        setActionLoading(true);
        setError(''); setSuccessMsg('');
        try {
            const fd = new FormData();
            fd.append('type', type);
            if (type === 'food' || type === 'exterior' || type === 'interior') {
                Array.from(fileList).forEach(f => fd.append('files', f));
            } else {
                fd.append('file', fileList[0]);
            }
            const res = await fetch(`${BASE}/api/cafe-owner/upload-cafe-photo`, { method: 'POST', headers: authHdr, body: fd });
            const data = await res.json();
            if (!res.ok || data.success !== true) throw new Error(data.message || 'Upload failed');
            setSuccessMsg('Uploaded successfully');
            fetchCafe();
        } catch (e) {
            setError(e.message);
        } finally {
            setActionLoading(false);
        }
    };
    const handleDrop = async (type, e) => {
        e.preventDefault();
        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) return;
        await uploadCafeFileDirect(type, files);
    };
    // Photos are available only after registration; no auto-register in upload handlers.

    const handleToggle = async (id) => {
        try {
            const res = await fetch(`${BASE}/api/cafe-owner/toggle-staff-status/${id}`, {
                method: 'POST', headers: authHdr
            });
            if (res.ok) { fetchStaff(); }
        } catch (e) { setError('Failed to toggle status'); }
    };

    const handleDelete = async (id) => {
        setActionLoading(true);
        try {
            const res = await fetch(`${BASE}/api/cafe-owner/remove-staff/${id}`, {
                method: 'DELETE', headers: authHdr
            });
            if (res.ok) {
                setSuccessMsg('Staff member removed.');
                fetchStaff();
            }
        } catch (e) {
            setError('Failed to remove staff');
        } finally {
            setActionLoading(false);
            setDeleteConfirm(null);
        }
    };

    const handleOrderStatusChange = async (orderId, newStatus) => {
        setActionLoading(true);
        try {
            const res = await fetch(`${BASE}/api/cafe-owner/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { ...authHdr, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setSuccessMsg('Order status updated');
                fetchOrders();
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to update order status');
            }
        } catch (err) {
            setError('Error updating order status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogout = () => { localStorage.clear(); navigate('/login'); };

    // Image Carousel Component for Menu Items
    const MenuImageCarousel = ({ item }) => {
        const [index, setIndex] = useState(0);
        const paths = item.imagePaths || [];

        const next = (e) => { e.stopPropagation(); setIndex((index + 1) % paths.length); };
        const prev = (e) => { e.stopPropagation(); setIndex((index - 1 + paths.length) % paths.length); };

        const deleteImg = async (e, path) => {
            e.stopPropagation();
            if (!window.confirm('Delete this image?')) return;
            try {
                const res = await fetch(`${BASE}/api/cafe-owner/menu/${item.id}/image?path=${encodeURIComponent(path)}`, {
                    method: 'DELETE', headers: authHdr
                });
                if (res.ok) fetchMenu();
            } catch (err) { setError('Failed to delete image'); }
        };

        const editImg = async (e, oldPath) => {
            e.stopPropagation();
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append('oldPath', oldPath);
                fd.append('file', file);
                try {
                    const res = await fetch(`${BASE}/api/cafe-owner/menu/${item.id}/image`, {
                        method: 'PUT', headers: authHdr, body: fd
                    });
                    if (res.ok) fetchMenu();
                } catch (err) { setError('Failed to update image'); }
            };
            input.click();
        };

        const addMore = async (e) => {
            e.stopPropagation();
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            input.onchange = async () => {
                const files = input.files;
                if (!files || files.length === 0) return;
                const fd = new FormData();
                Array.from(files).forEach(f => fd.append('files', f));
                try {
                    const res = await fetch(`${BASE}/api/cafe-owner/menu/${item.id}/images`, {
                        method: 'POST', headers: authHdr, body: fd
                    });
                    if (res.ok) fetchMenu();
                } catch (err) { setError('Failed to add images'); }
            };
            input.click();
        };

        if (paths.length === 0) {
            return (
                <Box sx={{
                    height: 160,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5',
                    borderRadius: 2.5,
                    border: '1px dashed #ddd'
                }}>
                    <Typography variant="caption" color="text.secondary">No Image</Typography>
                    <Button size="small" sx={{ textTransform: 'none', fontSize: '0.7rem' }} onClick={addMore}>Add Images</Button>
                </Box>
            );
        }

        return (
            <Box sx={{
                position: 'relative',
                height: 160,
                width: '100%',
                borderRadius: 2.5,
                overflow: 'hidden',
                bgcolor: '#f5f5f5',
                '&:hover .controls': { opacity: 1 }
            }}>
                <img
                    alt={item.name}
                    src={resolveSrc(paths[index])}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                    }}
                />

                {paths.length > 1 && (
                    <>
                        <IconButton size="small" onClick={prev} sx={{ position: 'absolute', left: 2, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'white' } }}>
                            <NavigateBefore fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={next} sx={{ position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'white' } }}>
                            <NavigateNext fontSize="small" />
                        </IconButton>
                    </>
                )}

                <Box className="controls" sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', gap: 1, p: 0.5, opacity: 0, transition: 'opacity 0.2s' }}>
                    <IconButton size="small" onClick={(e) => editImg(e, paths[index])} sx={{ color: 'white' }} title="Edit/Replace Image">
                        <Edit fontSize="inherit" />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => deleteImg(e, paths[index])} sx={{ color: 'white' }} title="Delete Image">
                        <DeleteForever fontSize="inherit" />
                    </IconButton>
                    <IconButton size="small" onClick={addMore} sx={{ color: 'white' }} title="Add More Images">
                        <AddCircle fontSize="inherit" />
                    </IconButton>
                </Box>

                {paths.length > 1 && (
                    <Box sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', px: 0.8, py: 0.2, borderRadius: 10, fontSize: '0.65rem' }}>
                        {index + 1}/{paths.length}
                    </Box>
                )}
            </Box>
        );
    };

    // Image Carousel for Tables
    const TableImageCarousel = ({ item }) => {
        const [index, setIndex] = useState(0);
        const initialCsv = item.images || item.photos || item.tableImages || item.imagePath || item.photoPath || '';
        const initialDerived = Array.isArray(initialCsv)
            ? initialCsv
            : (typeof initialCsv === 'string' && initialCsv.length > 0 ? initialCsv.split(',').filter(Boolean) : []);
        const initialPaths = item.imagePaths && Array.isArray(item.imagePaths) ? item.imagePaths : initialDerived;
        const [paths, setPaths] = useState(initialPaths);

        const normalizeList = (raw) => {
            if (!raw) return [];
            if (Array.isArray(raw)) return raw.filter(Boolean);
            if (typeof raw === 'string') return raw.split(',').filter(Boolean);
            if (raw.paths) return normalizeList(raw.paths);
            if (raw.urls) return normalizeList(raw.urls);
            return [];
        };
        const refetch = async () => {
            if (!item?.id) return;
            try {
                const resp = await fetch(`${BASE}/api/cafe-owner/tables/${item.id}/images`, { headers: authHdr });
                if (resp.ok) {
                    let data = null;
                    try { data = await resp.json(); } catch { }
                    setPaths(normalizeList(data));
                    setIndex(0);
                }
            } catch { }
        };
        useEffect(() => {
            if ((!paths || paths.length === 0) && item?.id) refetch();
        }, [item?.id]);

        const next = (e) => { e.stopPropagation(); if (paths.length) setIndex((index + 1) % paths.length); };
        const prev = (e) => { e.stopPropagation(); if (paths.length) setIndex((index - 1 + paths.length) % paths.length); };

        const deleteImg = async (e, path) => {
            e.stopPropagation();
            if (!window.confirm('Delete this image?')) return;
            try {
                const res = await fetch(`${BASE}/api/cafe-owner/tables/${item.id}/image?path=${encodeURIComponent(path)}`, {
                    method: 'DELETE', headers: authHdr
                });
                if (res.ok) refetch();
            } catch (err) { setError('Failed to delete image'); }
        };

        const editImg = async (e, oldPath) => {
            e.stopPropagation();
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append('oldPath', oldPath);
                fd.append('file', file);
                try {
                    const res = await fetch(`${BASE}/api/cafe-owner/tables/${item.id}/image`, {
                        method: 'PUT', headers: authHdr, body: fd
                    });
                    if (res.ok) {
                        let d = null;
                        try { d = await res.json(); } catch { }
                        const list = normalizeList(d);
                        if (list.length) {
                            setPaths(list);
                            setIndex(0);
                        } else {
                            refetch();
                        }
                    }
                } catch (err) { setError('Failed to update image'); }
            };
            input.click();
        };

        const addMore = async (e) => {
            e.stopPropagation();
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            input.onchange = async () => {
                const files = input.files;
                if (!files || files.length === 0) return;
                const fd = new FormData();
                Array.from(files).forEach(f => fd.append('files', f));
                try {
                    const res = await fetch(`${BASE}/api/cafe-owner/tables/${item.id}/images`, {
                        method: 'POST', headers: authHdr, body: fd
                    });
                    if (res.ok) {
                        let d = null;
                        try { d = await res.json(); } catch { }
                        const list = normalizeList(d);
                        if (list.length) {
                            setPaths(list);
                            setIndex(0);
                        } else {
                            refetch();
                        }
                    }
                } catch (err) { setError('Failed to add images'); }
            };
            input.click();
        };

        if (paths.length === 0) {
            return (
                <Box sx={{
                    height: 140,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#fcfaf7',
                    borderBottom: '1px solid #eee'
                }}>
                    <Typography variant="caption" color="text.secondary">No Image</Typography>
                    <Button size="small" sx={{ textTransform: 'none', fontSize: '0.7rem' }} onClick={addMore}>Add Images</Button>
                </Box>
            );
        }

        return (
            <Box sx={{
                position: 'relative',
                height: 140,
                width: '100%',
                overflow: 'hidden',
                bgcolor: '#fcfaf7',
                borderBottom: '1px solid #eee',
                '&:hover .controls': { opacity: 1 }
            }}>
                <img
                    alt={item.label}
                    src={resolveSrc(paths[index])}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                    }}
                />

                {paths.length > 1 && (
                    <>
                        <IconButton size="small" onClick={prev} sx={{ position: 'absolute', left: 2, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'white' } }}>
                            <NavigateBefore fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={next} sx={{ position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'white' } }}>
                            <NavigateNext fontSize="small" />
                        </IconButton>
                    </>
                )}

                <Box className="controls" sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', gap: 1, p: 0.5, opacity: 0, transition: 'opacity 0.2s' }}>
                    <IconButton size="small" onClick={(e) => editImg(e, paths[index])} sx={{ color: 'white' }} title="Edit/Replace Image">
                        <Edit fontSize="inherit" />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => deleteImg(e, paths[index])} sx={{ color: 'white' }} title="Delete Image">
                        <DeleteForever fontSize="inherit" />
                    </IconButton>
                    <IconButton size="small" onClick={addMore} sx={{ color: 'white' }} title="Add More Images">
                        <AddCircle fontSize="inherit" />
                    </IconButton>
                </Box>

                {paths.length > 1 && (
                    <Box sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', px: 0.8, py: 0.2, borderRadius: 10, fontSize: '0.65rem' }}>
                        {index + 1}/{paths.length}
                    </Box>
                )}
            </Box>
        );
    };
    // ── Stats ───────────────────────────────────────────────────────────────
    const chefs = staff.filter(s => s.role === 'chef');
    const waiters = staff.filter(s => s.role === 'waiter');
    const active = staff.filter(s => s.status === 'active');

    // ── Sidebar nav items ───────────────────────────────────────────────────
    const navItems = [
        { id: 'overview', text: 'Overview', icon: <Dashboard /> },
        { id: 'cafe', text: 'My Café', icon: <Coffee /> },
        { id: 'tables', text: 'Tables', icon: <Group /> },
        { id: 'orders', text: 'Orders', icon: <Receipt /> },
        { id: 'menu', text: 'Menu', icon: <LocalDining /> },
        { id: 'staff', text: 'My Staff', icon: <Group /> },
        { id: 'profile', text: 'My Profile', icon: <Person /> },
    ];

    // ── Overview tab ────────────────────────────────────────────────────────
    const renderOverview = () => {
        const staffByRole = [
            { name: 'Chefs', value: chefs.length },
            { name: 'Waiters', value: waiters.length }
        ];

        const chartData = summary?.trend?.map(h => ({
            name: `${h.hour}:00`,
            sales: h.sales,
            orders: h.orders
        })) || [];

        return (
            <Box>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif" }}>
                        Welcome, {userData.firstName || 'Café Owner'}! ☕
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Manage your café from this dashboard.</Typography>
                </Box>

                {/* Top Statistics */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 2, mb: 3 }}>
                    {[
                        { label: 'Total Staff', value: staff.length, color: '#3c2a21', icon: <Group /> },
                        { label: 'Chefs', value: chefs.length, color: '#5d4037', icon: <Restaurant /> },
                        { label: 'Waiters', value: waiters.length, color: '#1565c0', icon: <LocalDining /> },
                        { label: 'Active', value: active.length, color: '#2e7d32', icon: <CheckCircle /> },
                    ].map(s => (
                        <Box key={s.label}>
                            <Card className="animate-scale-in" sx={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', bgcolor: '#fff', backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #fcfaf7 100%)', border: '1px solid rgba(0,0,0,0.06)', height: 160, display: 'flex', width: '100%' }}>
                                <CardContent sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                        <Box>
                                            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary' }}>{s.label}</Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 800 }}>{s.value}</Typography>
                                        </Box>
                                        <Box sx={{ p: 1.5, borderRadius: 'var(--radius-md)', bgcolor: `${s.color}22`, color: s.color }}>
                                            {s.icon}
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                    ))}
                </Box>

                {/* Charts Section */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 2 }}>
                    <Paper className="animate-slide-up" sx={{ p: 3, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', height: 360 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'var(--color-primary)' }}>Today's Sales Trend (Hourly)</Typography>
                        <Box sx={{ width: '100%', height: 'calc(100% - 36px)' }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="orderBarGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#7f5539" stopOpacity={0.95} />
                                                <stop offset="100%" stopColor="#d4a373" stopOpacity={0.9} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fill: '#7f5539', fontSize: 12, fontWeight: 600 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fill: '#7f5539', fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <RechartsTooltip
                                            contentStyle={{ background: '#fff', border: '1px solid #eee', borderRadius: 8 }}
                                            cursor={{ fill: 'rgba(212,163,115,0.12)' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Bar
                                            dataKey="sales"
                                            name="Revenue (₹)"
                                            fill="url(#orderBarGrad)"
                                            radius={[8, 8, 0, 0]}
                                            barSize={40}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'text.secondary' }}>
                                    <Typography>No sales data available yet</Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                    <Paper className="animate-slide-up delay-200" sx={{ p: 3, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', height: 360 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'var(--color-primary)' }}>Staff Distribution</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 220px', gap: 2, height: 'calc(100% - 36px)' }}>
                            <Box sx={{ height: '100%', minWidth: 0, minHeight: 280 }}>
                                {staffByRole.some(s => s.value > 0) ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={staffByRole}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={0}
                                                outerRadius={120}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {staffByRole.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'text.secondary' }}>
                                        <Typography>No staff data available yet</Typography>
                                    </Box>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
                                {staffByRole.map((entry, index) => (
                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length] }} />
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{entry.name}</Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">{entry.value}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                {staff.length === 0 && !loading && (
                    <Paper sx={{ mt: 4, p: 5, textAlign: 'center', borderRadius: 4, border: '2px dashed #e6ccb2' }}>
                        <Coffee sx={{ fontSize: 60, color: '#d4a373', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'var(--color-primary)', fontWeight: 700 }}>Ready to start?</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Add your team to begin managing your café.
                        </Typography>
                        <Button variant="contained" onClick={() => setActiveTab('add')}
                            sx={{ bgcolor: 'var(--color-primary)', textTransform: 'none', borderRadius: 2 }}>
                            + Add Your Team
                        </Button>
                    </Paper>
                )}
            </Box>
        );
    };

    // ── My Staff tab ────────────────────────────────────────────────────────

    const renderStaff = () => (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif" }}>My Staff</Typography>
                    <Typography variant="body2" color="text.secondary">All chefs and waiters under your café.</Typography>
                </Box>
                <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setActiveTab('add')}
                    sx={{ bgcolor: 'var(--color-primary)', textTransform: 'none', borderRadius: 2 }}>
                    Add Staff
                </Button>
            </Box>

            {staff.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, border: '2px dashed #e6ccb2' }}>
                    <Typography color="text.secondary">No staff members yet. Add your first one!</Typography>
                </Paper>
            ) : (
                <Paper className="animate-slide-up" sx={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#fcfaf7' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Staff Member</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {staff.map((s) => (
                                    <TableRow key={s.id} sx={{ opacity: s.status === 'active' ? 1 : 0.7 }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{
                                                    bgcolor: ROLE_STYLES[s.role]?.bg,
                                                    color: ROLE_STYLES[s.role]?.color,
                                                    fontWeight: 700
                                                }}>
                                                    {s.firstName[0]}
                                                </Avatar>
                                                <Typography sx={{ fontWeight: 600 }}>
                                                    {s.firstName} {s.lastName}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{s.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={ROLE_STYLES[s.role]?.icon}
                                                label={ROLE_STYLES[s.role]?.label || s.role}
                                                size="small"
                                                sx={{
                                                    bgcolor: ROLE_STYLES[s.role]?.bg,
                                                    color: ROLE_STYLES[s.role]?.color,
                                                    fontWeight: 700,
                                                    fontSize: '0.7rem'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={s.status.toUpperCase()}
                                                size="small"
                                                color={s.status === 'active' ? 'success' : 'default'}
                                                sx={{ fontSize: '0.65rem', fontWeight: 700 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                <Tooltip title={s.status === 'active' ? 'Deactivate' : 'Activate'}>
                                                    <IconButton size="small" onClick={() => handleToggle(s.id)}
                                                        sx={{ color: s.status === 'active' ? 'success.main' : 'text.disabled' }}>
                                                        {s.status === 'active' ? <ToggleOn /> : <ToggleOff />}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Remove Staff">
                                                    <IconButton size="small" onClick={() => setDeleteConfirm(s.id)} sx={{ color: 'error.main' }}>
                                                        <Delete />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </Box>
    );

    // ── Add Staff tab ───────────────────────────────────────────────────────
    const renderAddStaff = () => (
        <Box sx={{ maxWidth: 850, mx: 'auto', px: { xs: 2, md: 4 }, pb: 8 }}>
            <Button
                startIcon={<ArrowBackIosNew sx={{ fontSize: '0.9rem' }} />}
                onClick={() => setActiveTab('staff')}
                sx={{
                    mb: 3,
                    textTransform: 'none',
                    color: 'text.secondary',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'transparent', color: 'var(--color-primary)' }
                }}
            >
                Back to Staff List
            </Button>

            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h3" sx={{
                    fontWeight: 900,
                    color: 'var(--color-primary)',
                    fontFamily: "'Playfair Display', serif",
                    mb: 1
                }}>
                    Add New Staff
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Register a new member to your café team and send them login credentials.
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setError('')}>{error}</Alert>}
            {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

            <form onSubmit={handleAddStaff}>
                <Stack spacing={4}>
                    {/* Section 1: Personal Details */}
                    <Paper className="animate-slide-up" sx={{ p: 4, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, color: '#3c2a21' }}>
                            <Person sx={{ color: 'var(--color-primary)' }} /> Personal Details
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="First Name" required placeholder="e.g. John"
                                    value={form.firstName}
                                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Last Name" required placeholder="e.g. Doe"
                                    value={form.lastName}
                                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Date of Birth" type="date" required InputLabelProps={{ shrink: true }}
                                    value={form.dob}
                                    onChange={e => setForm({ ...form, dob: e.target.value })}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Cake sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField select fullWidth label="Gender" required value={form.gender}
                                    onChange={e => setForm({ ...form, gender: e.target.value })}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Wc sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }}>
                                    <MenuItem value="male">Male</MenuItem>
                                    <MenuItem value="female">Female</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField select fullWidth label="Role" required value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Work sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }}>
                                    <MenuItem value="waiter">Waiter</MenuItem>
                                    <MenuItem value="chef">Chef</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Phone Number" placeholder="e.g. 9876543210"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Email Address" type="email" required placeholder="staff@example.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }} />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Section 2: Address Details */}
                    <Paper className="animate-slide-up delay-200" sx={{ p: 4, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, color: '#3c2a21' }}>
                            <Home sx={{ color: 'var(--color-primary)' }} /> Address & Location
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Plot / House No." placeholder="e.g. 123"
                                    value={form.plotNo}
                                    onChange={e => setForm({ ...form, plotNo: e.target.value })}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Home sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth required label="Street Name" placeholder="e.g. Main Street"
                                    value={form.street}
                                    onChange={e => setForm({ ...form, street: e.target.value })}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Map sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Landmark" placeholder="e.g. Near City Park"
                                    value={form.landmark}
                                    onChange={e => setForm({ ...form, landmark: e.target.value })}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><PinDrop sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth required label="City" placeholder="e.g. Mumbai"
                                    value={form.city}
                                    onChange={e => setForm({ ...form, city: e.target.value })}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><LocationCity sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth required label="Pincode" placeholder="e.g. 400001"
                                    value={form.pincode}
                                    onChange={e => setForm({ ...form, pincode: e.target.value })}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><PinDrop sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Detailed Address (optional)" placeholder="e.g. Apartment, Suite, Floor"
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Home sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }} />
                            </Grid>
                        </Grid>
                    </Paper>

                    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={actionLoading}
                            sx={{
                                py: 2,
                                px: 10,
                                bgcolor: 'var(--color-primary)',
                                textTransform: 'none',
                                borderRadius: 3,
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                boxShadow: '0 10px 30px rgba(60, 42, 33, 0.3)',
                                width: { xs: '100%', sm: 'auto' },
                                minWidth: 350,
                                '&:hover': {
                                    bgcolor: '#2C1E19',
                                    boxShadow: '0 15px 40px rgba(60, 42, 33, 0.4)',
                                    transform: 'translateY(-2px)'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {actionLoading
                                ? <CircularProgress size={26} color="inherit" />
                                : '✓  Register Staff Member'}
                        </Button>
                    </Box>
                </Stack>
            </form>
        </Box>
    );

    const renderTables = () => (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif" }}>
                    Tables
                </Typography>
                <Button variant="contained" startIcon={<AddCircle />} onClick={() => setAddTableDialogOpen(true)}
                    sx={{ bgcolor: 'var(--color-primary)', textTransform: 'none', borderRadius: 2 }}>
                    Add Table
                </Button>
            </Box>
            {tableStats && (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 2, mb: 2 }}>
                    {[
                        { label: 'Total', value: tableStats.total },
                        { label: 'Free', value: tableStats.freeCount },
                        { label: 'Special', value: tableStats.specialCount },
                        { label: 'Special Price Sum', value: tableStats.totalSpecialPrice }
                    ].map(s => (
                        <Box key={s.label}>
                            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 'var(--radius-md)', height: 90, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>{s.label}</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>{s.value ?? 0}</Typography>
                            </Paper>
                        </Box>
                    ))}
                </Box>
            )}
            <Paper className="animate-slide-up" sx={{ p: 3, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <Typography sx={{ fontWeight: 700, mb: 2 }}>Existing Tables</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 260px)', gap: 1.5, justifyContent: 'space-between' }}>
                    {tables.map(t => {
                        const first = (t.images || t.photos || '')?.split(',')[0];
                        return (
                            <Card key={t.id} className="animate-slide-up" sx={{
                                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', width: 260, height: 320, display: 'flex', flexDirection: 'column'
                            }}>
                                <TableImageCarousel item={t} />
                                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Typography sx={{ fontWeight: 800 }}>{t.label}</Typography>
                                    <Typography variant="caption" color="text.secondary">{t.type || 'casual'}</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                        <Chip size="small" label={`Cap ${t.capacity || '-'}`} sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700 }} />
                                        <Chip size="small" label={`₹${t.price || 0}`} sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700 }} />
                                        {t.pricePerHour && <Chip size="small" label={`₹/hr ${t.pricePerHour}`} sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700 }} />}
                                    </Box>
                                    <Chip
                                        label={t.isAvailable ? 'Free' : 'Occupied'}
                                        size="small"
                                        color={t.isAvailable ? 'success' : 'default'}
                                        sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700, mt: 0.5, width: 'fit-content' }}
                                    />
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
                                        <Button color="error" size="small" onClick={() => removeTable(t.id)} sx={{ textTransform: 'none' }}>Remove</Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        );
                    })}
                    {tables.length === 0 && (
                        <Box sx={{ gridColumn: '1 / -1', py: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">No tables yet.</Typography>
                        </Box>
                    )}
                </Box>
            </Paper>
            <Dialog
                open={addTableDialogOpen}
                onClose={() => setAddTableDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle sx={{ fontWeight: 900, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif", textAlign: 'center' }}>
                    Add Table
                </DialogTitle>
                <DialogContent sx={{ px: 4 }}>
                    <form id="add-table-form" onSubmit={addTable}>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}><TextField fullWidth label="Table Name" required value={newTable.label} onChange={e => setNewTable({ ...newTable, label: e.target.value })} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth label="Table No." required value={newTable.tableNo} onChange={e => setNewTable({ ...newTable, tableNo: e.target.value })} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth label="Capacity" type="number" value={newTable.capacity} onChange={e => setNewTable({ ...newTable, capacity: e.target.value })} /></Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Special Occasion</InputLabel>
                                    <Select value={newTable.type} label="Special Occasion" onChange={e => setNewTable({ ...newTable, type: e.target.value })}>
                                        <MenuItem value="casual">Casual</MenuItem>
                                        <MenuItem value="birthday">Birthday</MenuItem>
                                        <MenuItem value="anniversary">Anniversary</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth label="Cost / Hour" required type="number" value={newTable.pricePerHour} onChange={e => setNewTable({ ...newTable, pricePerHour: e.target.value })} /></Grid>
                            <Grid item xs={12}><FormControlLabel control={<Checkbox checked={newTable.isAvailable} onChange={e => setNewTable({ ...newTable, isAvailable: e.target.checked })} />} label="Available" /></Grid>
                            <Grid item xs={12}>
                                <Typography sx={{ fontWeight: 700, mb: 1 }}>Table Images</Typography>
                                <Box onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const files = Array.from(e.dataTransfer.files || []); setNewTableImages(prev => [...prev, ...files.filter(f => f.type.startsWith('image/'))]); }}
                                    sx={{ border: '2px dashed #e0e0e0', borderRadius: 2, p: 2, textAlign: 'center', mb: 2, bgcolor: '#fcfaf7' }}>
                                    <Typography variant="caption" color="text.secondary">Drag & drop multiple images here</Typography>
                                </Box>
                                <Button component="label" variant="outlined" sx={{ textTransform: 'none', mr: 2 }}>
                                    Upload
                                    <input hidden type="file" multiple accept="image/*" onChange={e => setNewTableImages(prev => [...prev, ...Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'))])} />
                                </Button>
                                {newTableImages.length > 0 && (
                                    <Grid container spacing={1.5} sx={{ mt: 1 }}>
                                        {newTableImages.map((f, i) => (
                                            <Grid item key={i}>
                                                <Box sx={{ position: 'relative' }}>
                                                    <img alt={"Table " + (i + 1)} src={URL.createObjectURL(f)} style={{ height: 72, width: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                            </Grid>
                        </Grid>
                    </form>
                </DialogContent>
                <DialogActions sx={{ px: 4, pb: 3 }}>
                    <Button onClick={() => setAddTableDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button type="submit" form="add-table-form" variant="contained" disabled={actionLoading} sx={{ textTransform: 'none' }}>
                        {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Add Table'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );

    const renderMenu = () => {
        const categories = ['all', ...new Set(menu.map(m => m.category).filter(Boolean))];

        const filteredMenu = menu.filter(m => {
            const name = (m.name || '').toLowerCase();
            const search = (menuSearch || '').toLowerCase();
            const matchesSearch = name.includes(search);
            const matchesFilter = menuFilter === 'all' || m.category === menuFilter;
            return matchesSearch && matchesFilter;
        });

        const paginatedMenu = filteredMenu.slice((menuPage - 1) * itemsPerPage, menuPage * itemsPerPage);
        const totalPages = Math.ceil(filteredMenu.length / (itemsPerPage || 1));

        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif" }}>
                        Menu ({filteredMenu.length})
                    </Typography>
                    <Button variant="contained" startIcon={<AddCircle />} onClick={() => setAddDialogOpen(true)}
                        sx={{ textTransform: 'none', borderRadius: 2, bgcolor: 'var(--color-primary)' }}>
                        Add Item
                    </Button>
                </Box>

                <Paper className="glass-card" sx={{ p: 2, mb: 3, borderRadius: 'var(--radius-lg)', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Search menu..."
                        value={menuSearch}
                        onChange={e => { setMenuSearch(e.target.value); setMenuPage(1); }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ flexGrow: 1, minWidth: 200 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={menuFilter}
                            label="Category"
                            onChange={e => { setMenuFilter(e.target.value); setMenuPage(1); }}
                        >
                            {categories.map(cat => (
                                <MenuItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Paper>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 260px)', gap: 1.5, justifyContent: 'space-between' }}>
                    {paginatedMenu.map(m => (
                        <Box key={m.id} sx={{ width: 260 }}>
                            <Card className="animate-slide-up" sx={{
                                borderRadius: 'var(--radius-lg)',
                                boxShadow: 'var(--shadow-lg)',
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                height: 360,
                                bgcolor: '#fff',
                                border: '1px solid rgba(0,0,0,0.06)',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-4px)' }
                            }}>
                                <CardContent sx={{ display: 'flex', flexDirection: 'column', p: 2, height: '100%' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, height: '100%' }}>
                                        <MenuImageCarousel item={m} />

                                        <Box sx={{ textAlign: 'center', flexGrow: 1, width: '100%', mt: 1 }}>
                                            <Typography sx={{
                                                fontWeight: 700,
                                                fontSize: '1rem',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                lineHeight: 1.2,
                                                height: '2.4em',
                                                mb: 0.5
                                            }}>
                                                {m.name}
                                            </Typography>
                                            <Typography sx={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: '1.1rem' }}>
                                                ₹{m.price || 0}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                {m.category || '-'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mt: 'auto', width: '100%' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1.5 }}>
                                                <Chip
                                                    label={m.isVeg ? 'Veg' : 'Non-Veg'}
                                                    size="small"
                                                    sx={{
                                                        fontSize: '0.65rem',
                                                        height: 20,
                                                        bgcolor: m.isVeg ? '#e8f5e9' : '#fff3e0',
                                                        color: m.isVeg ? '#2e7d32' : '#e65100',
                                                        fontWeight: 700
                                                    }}
                                                />
                                                <Chip
                                                    label={m.available ? 'In Stock' : 'Out of Stock'}
                                                    size="small"
                                                    color={m.available ? 'success' : 'error'}
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700 }}
                                                />
                                            </Box>
                                            <Divider sx={{ mb: 1.5, opacity: 0.6 }} />

                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                <Tooltip title="Edit Item">
                                                    <IconButton size="small" onClick={() => handleEditClick(m)} sx={{ color: 'var(--color-primary)' }}>
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete Item">
                                                    <IconButton size="small" onClick={() => removeMenuItem(m.id)} sx={{ color: 'error.main' }}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                    ))}
                    {paginatedMenu.length === 0 && (
                        <Box sx={{ gridColumn: '1 / -1' }}>
                            <Alert severity="info">
                                {menu.length === 0 ? "No menu items yet. Click Add Item to create one." : "No items match your search/filter."}
                            </Alert>
                        </Box>
                    )}
                </Box>

                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination
                            count={totalPages}
                            page={menuPage}
                            onChange={(e, v) => setMenuPage(v)}
                            color="primary"
                        />
                    </Box>
                )}

                {/* Add Menu Item Dialog */}
                <Dialog
                    open={addDialogOpen}
                    onClose={() => setAddDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 4,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        }
                    }}
                >
                    <DialogTitle sx={{
                        fontWeight: 900,
                        color: 'var(--color-primary)',
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1.75rem',
                        pt: 3,
                        pb: 1,
                        textAlign: 'center'
                    }}>
                        Add Menu Item
                    </DialogTitle>
                    <DialogContent sx={{ px: 4, py: 2 }}>
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                            Fill in the details to add a new delicious item to your menu.
                        </Typography>
                        <form id="add-item-form" onSubmit={addMenuItem}>
                            <Grid container spacing={2.5}>
                                {/* Row 1 */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Item Name"
                                        required
                                        placeholder="e.g. Cappuccino Royale"
                                        value={newItem.name}
                                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                        variant="outlined"
                                        InputProps={{
                                            sx: { borderRadius: 2.5 },
                                            startAdornment: <InputAdornment position="start"><Coffee sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment>
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel id="category-label">Category</InputLabel>
                                        <Select
                                            labelId="category-label"
                                            label="Category"
                                            value={newItem.category}
                                            onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                            sx={{ borderRadius: 2.5 }}
                                            startAdornment={<InputAdornment position="start"><LocalDining sx={{ color: 'text.disabled', fontSize: 20, ml: 1 }} /></InputAdornment>}
                                        >
                                            <MenuItem value="Beverages">Beverages</MenuItem>
                                            <MenuItem value="Snacks">Snacks</MenuItem>
                                            <MenuItem value="Desserts">Desserts</MenuItem>
                                            <MenuItem value="Breakfast">Breakfast</MenuItem>
                                            <MenuItem value="Lunch">Lunch</MenuItem>
                                            <MenuItem value="Dinner">Dinner</MenuItem>
                                            <MenuItem value="Specials">Specials</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {/* Row 2 */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Price"
                                        type="number"
                                        required
                                        placeholder="0.00"
                                        value={newItem.price}
                                        onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                        variant="outlined"
                                        InputProps={{
                                            sx: { borderRadius: 2.5 },
                                            startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: 'var(--color-primary)', mr: 0.5 }}>₹</Typography></InputAdornment>
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        height: '100%',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 2.5,
                                        px: 2,
                                        bgcolor: '#fff'
                                    }}>
                                        <FormControlLabel
                                            control={<Checkbox checked={newItem.isVeg} onChange={e => setNewItem({ ...newItem, isVeg: e.target.checked })} color="success" size="small" />}
                                            label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Veg</Typography>}
                                            sx={{ mr: 2 }}
                                        />
                                        <FormControlLabel
                                            control={<Checkbox checked={newItem.available} onChange={e => setNewItem({ ...newItem, available: e.target.checked })} size="small" />}
                                            label={<Typography variant="body2" sx={{ fontWeight: 600 }}>In Stock</Typography>}
                                        />
                                    </Box>
                                </Grid>

                                {/* Description */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Description"
                                        multiline
                                        rows={3}
                                        placeholder="Describe the taste, ingredients, special notes..."
                                        value={newItem.description}
                                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                        variant="outlined"
                                        InputProps={{ sx: { borderRadius: 2.5 } }}
                                    />
                                </Grid>

                                {/* Image Upload */}
                                <Grid item xs={12}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 3,
                                            borderRadius: 3,
                                            bgcolor: '#fcfaf7',
                                            borderStyle: 'dashed',
                                            borderColor: '#d4a373',
                                            textAlign: 'center',
                                            transition: 'all 0.2s',
                                            '&:hover': { bgcolor: '#f5f0eb', borderColor: 'var(--color-primary)' }
                                        }}
                                    >
                                        <Box sx={{ mb: 1.5 }}>
                                            <PhotoLibrary sx={{ fontSize: 40, color: '#d4a373', mb: 1 }} />
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Upload Product Photos</Typography>
                                            <Typography variant="caption" color="text.secondary">Select one or more images for a slideshow</Typography>
                                        </Box>

                                        <Button
                                            component="label"
                                            variant="contained"
                                            startIcon={<CloudUpload />}
                                            sx={{
                                                textTransform: 'none',
                                                borderRadius: 2,
                                                bgcolor: 'var(--color-primary)',
                                                px: 4,
                                                py: 1,
                                                '&:hover': { bgcolor: '#3c2a21' }
                                            }}
                                        >
                                            Select Images
                                            <input
                                                hidden
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onClick={(e) => { e.target.value = null; }} // Reset to allow re-selecting same files
                                                onChange={e => {
                                                    const files = Array.from(e.target.files || []);
                                                    setNewItemImages(prev => {
                                                        const combined = [...prev, ...files];
                                                        // Simple deduplication by name and size
                                                        return combined.filter((file, index, self) =>
                                                            index === self.findIndex((t) => (
                                                                t.name === file.name && t.size === file.size
                                                            ))
                                                        );
                                                    });
                                                }}
                                            />
                                        </Button>

                                        {newItemImages.length > 0 && (
                                            <Box sx={{ mt: 3 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 1 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main' }}>
                                                        {newItemImages.length} Images Selected
                                                    </Typography>
                                                    <Button size="small" color="error" onClick={() => setNewItemImages([])} sx={{ textTransform: 'none', fontSize: '0.7rem' }}>
                                                        Clear All
                                                    </Button>
                                                </Box>
                                                <Grid container spacing={1} sx={{ maxHeight: 150, overflowY: 'auto', p: 0.5 }}>
                                                    {newItemImages.map((file, idx) => (
                                                        <Grid item key={idx}>
                                                            <Box sx={{ position: 'relative', width: 60, height: 60, borderRadius: 1, overflow: 'hidden', border: '1px solid #ddd' }}>
                                                                <img
                                                                    src={URL.createObjectURL(file)}
                                                                    alt="preview"
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                />
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => setNewItemImages(prev => prev.filter((_, i) => i !== idx))}
                                                                    sx={{
                                                                        position: 'absolute', top: -4, right: -4,
                                                                        bgcolor: 'rgba(255,255,255,0.8)', color: 'error.main',
                                                                        padding: '2px', '&:hover': { bgcolor: '#fff' }
                                                                    }}
                                                                >
                                                                    <Cancel sx={{ fontSize: 14 }} />
                                                                </IconButton>
                                                            </Box>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>
                        </form>
                    </DialogContent>
                    <DialogActions sx={{ px: 4, pb: 4, gap: 2 }}>
                        <Button
                            onClick={() => setAddDialogOpen(false)}
                            variant="outlined"
                            fullWidth
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.2 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="add-item-form"
                            variant="contained"
                            disabled={actionLoading}
                            fullWidth
                            sx={{
                                bgcolor: 'var(--color-primary)',
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 800,
                                py: 1.2,
                                boxShadow: '0 4px 14px rgba(60, 42, 33, 0.3)',
                                '&:hover': { bgcolor: '#2C1E19' }
                            }}
                        >
                            {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Item'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Edit Menu Item Dialog */}
                <Dialog
                    open={editDialogOpen}
                    onClose={() => setEditDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 4,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        }
                    }}
                >
                    <DialogTitle sx={{
                        fontWeight: 900,
                        color: 'var(--color-primary)',
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1.75rem',
                        pt: 3,
                        pb: 1,
                        textAlign: 'center'
                    }}>
                        Edit Menu Item
                    </DialogTitle>
                    <DialogContent sx={{ px: 4, py: 2 }}>
                        {editingItem && (
                            <form id="edit-item-form" onSubmit={updateMenuItem}>
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Item Name"
                                            required
                                            value={editingItem.name}
                                            onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                            variant="outlined"
                                            InputProps={{
                                                sx: { borderRadius: 2.5 },
                                                startAdornment: <InputAdornment position="start"><Coffee sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment>
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth variant="outlined">
                                            <InputLabel id="edit-category-label">Category</InputLabel>
                                            <Select
                                                labelId="edit-category-label"
                                                label="Category"
                                                value={editingItem.category}
                                                onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                                                sx={{ borderRadius: 2.5 }}
                                                startAdornment={<InputAdornment position="start"><LocalDining sx={{ color: 'text.disabled', fontSize: 20, ml: 1 }} /></InputAdornment>}
                                            >
                                                <MenuItem value="Beverages">Beverages</MenuItem>
                                                <MenuItem value="Snacks">Snacks</MenuItem>
                                                <MenuItem value="Desserts">Desserts</MenuItem>
                                                <MenuItem value="Breakfast">Breakfast</MenuItem>
                                                <MenuItem value="Lunch">Lunch</MenuItem>
                                                <MenuItem value="Dinner">Dinner</MenuItem>
                                                <MenuItem value="Specials">Specials</MenuItem>
                                                <MenuItem value="Other">Other</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Price"
                                            type="number"
                                            required
                                            value={editingItem.price}
                                            onChange={e => setEditingItem({ ...editingItem, price: e.target.value })}
                                            variant="outlined"
                                            InputProps={{
                                                sx: { borderRadius: 2.5 },
                                                startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: 'var(--color-primary)', mr: 0.5 }}>₹</Typography></InputAdornment>
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            height: '100%',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 2.5,
                                            px: 2,
                                            bgcolor: '#fff'
                                        }}>
                                            <FormControlLabel
                                                control={<Checkbox checked={editingItem.isVeg} onChange={e => setEditingItem({ ...editingItem, isVeg: e.target.checked })} color="success" size="small" />}
                                                label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Veg</Typography>}
                                                sx={{ mr: 2 }}
                                            />
                                            <FormControlLabel
                                                control={<Checkbox checked={editingItem.available} onChange={e => setEditingItem({ ...editingItem, available: e.target.checked })} size="small" />}
                                                label={<Typography variant="body2" sx={{ fontWeight: 600 }}>In Stock</Typography>}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Description"
                                            multiline
                                            rows={3}
                                            value={editingItem.description}
                                            onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                            variant="outlined"
                                            InputProps={{ sx: { borderRadius: 2.5 } }}
                                        />
                                    </Grid>
                                </Grid>
                            </form>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 4, pb: 4, gap: 2 }}>
                        <Button
                            onClick={() => setEditDialogOpen(false)}
                            variant="outlined"
                            fullWidth
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.2 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="edit-item-form"
                            variant="contained"
                            disabled={actionLoading}
                            fullWidth
                            sx={{
                                bgcolor: 'var(--color-primary)',
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 800,
                                py: 1.2,
                                boxShadow: '0 4px 14px rgba(60, 42, 33, 0.3)',
                                '&:hover': { bgcolor: '#2C1E19' }
                            }}
                        >
                            {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    };
    const renderCafe = () => (
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif", mb: 1 }}>
                {cafeMeta.exists ? 'Update Café Details' : 'Register Your Café'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Provide required details for listing and operations.
            </Typography>
            <Stepper activeStep={Math.min(cafeStep, 6)} sx={{ mb: 3 }}>
                <Step><StepLabel>Basic</StepLabel></Step>
                <Step><StepLabel>Address</StepLabel></Step>
                <Step><StepLabel>Business</StepLabel></Step>
                <Step><StepLabel>Bank</StepLabel></Step>
                <Step><StepLabel>Services</StepLabel></Step>
                <Step><StepLabel>Photos</StepLabel></Step>
                <Step><StepLabel>Review</StepLabel></Step>
            </Stepper>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
            <Paper className="cafe-reg" sx={{ p: 4, borderRadius: 4 }}>
                <form onSubmit={handleSaveCafe}>
                    {cafeStep === 0 && (
                        <>
                            <Typography sx={{ fontWeight: 700, mb: 2 }}>Basic Information</Typography>
                            <Box className="pair-grid">
                                <Box>
                                    <TextField fullWidth required label="Café Name" value={cafeForm.cafeName}
                                        onChange={e => setCafeForm({ ...cafeForm, cafeName: e.target.value })} />
                                </Box>
                                <Box>
                                    <TextField fullWidth required label="Owner Name" value={cafeForm.ownerName}
                                        onChange={e => setCafeForm({ ...cafeForm, ownerName: e.target.value })} />
                                </Box>
                                <Box>
                                    <TextField fullWidth required label="Contact Number" value={cafeForm.contactNumber}
                                        onChange={e => setCafeForm({ ...cafeForm, contactNumber: e.target.value })} />
                                </Box>
                                <Box>
                                    <TextField fullWidth required type="email" label="Email" value={cafeForm.email}
                                        onChange={e => setCafeForm({ ...cafeForm, email: e.target.value })} />
                                </Box>
                                <Box>
                                    <TextField fullWidth required type="time" label="Opening Time" InputLabelProps={{ shrink: true }}
                                        value={cafeForm.openingTime}
                                        onChange={e => setCafeForm({ ...cafeForm, openingTime: e.target.value })} />
                                </Box>
                                <Box>
                                    <TextField fullWidth required type="time" label="Closing Time" InputLabelProps={{ shrink: true }}
                                        value={cafeForm.closingTime}
                                        onChange={e => setCafeForm({ ...cafeForm, closingTime: e.target.value })} />
                                </Box>
                            </Box>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                                    <Button variant="contained" onClick={() => { if (validateBasic()) setCafeStep(1); }}
                                        sx={{ textTransform: 'none', borderRadius: 2, bgcolor: 'var(--color-primary)' }}>
                                        Next
                                    </Button>
                                </Box>
                            </Grid>
                            <Divider sx={{ my: 3 }} />
                        </>
                    )}
                    {cafeStep === 2 && (
                        <>
                            <Typography sx={{ fontWeight: 700, mb: 2 }}>Business Details</Typography>
                            <Box className="pair-grid">
                                <Box>
                                    <TextField fullWidth required label="Business Type" value={cafeForm.businessType}
                                        onChange={e => setCafeForm({ ...cafeForm, businessType: e.target.value })} />
                                </Box>
                                <Box>
                                    <TextField fullWidth required label="FSSAI License Number" value={cafeForm.fssaiLicenseNumber}
                                        onChange={e => setCafeForm({ ...cafeForm, fssaiLicenseNumber: e.target.value })} />
                                </Box>
                                <Box>
                                    <TextField fullWidth label="GST Number" value={cafeForm.gstNumber}
                                        onChange={e => setCafeForm({ ...cafeForm, gstNumber: e.target.value })} />
                                </Box>
                                <Box />
                                <Box sx={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                                    <Button variant="text" onClick={() => setCafeStep(1)} sx={{ textTransform: 'none' }}>
                                        Back
                                    </Button>
                                    <Button variant="contained" onClick={() => { if (validateBusiness()) setCafeStep(3); }}
                                        sx={{ textTransform: 'none', borderRadius: 2, bgcolor: 'var(--color-primary)' }}>
                                        Next
                                    </Button>
                                </Box>
                            </Box>
                        </>
                    )}
                    {cafeStep === 3 && (
                        <>
                            <Typography sx={{ fontWeight: 700, mb: 2 }}>Bank / Payments</Typography>
                            <Box className="pair-grid">
                                <Box>
                                    <TextField fullWidth label="Account Holder Name" value={cafeForm.accountHolderName}
                                        onChange={e => setCafeForm({ ...cafeForm, accountHolderName: e.target.value })} />
                                </Box>
                                <Box>
                                    <TextField fullWidth label="Account Number" value={cafeForm.accountNumber}
                                        onChange={e => setCafeForm({ ...cafeForm, accountNumber: e.target.value })} />
                                </Box>
                                <Box>
                                    <TextField fullWidth label="IFSC Code" value={cafeForm.ifscCode}
                                        onChange={e => setCafeForm({ ...cafeForm, ifscCode: e.target.value })} />
                                </Box>
                                <Box>
                                    <TextField fullWidth label="UPI ID" value={cafeForm.upiId}
                                        onChange={e => setCafeForm({ ...cafeForm, upiId: e.target.value })} />
                                </Box>
                                <Box sx={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                                    <Button variant="text" onClick={() => setCafeStep(2)} sx={{ textTransform: 'none' }}>
                                        Back
                                    </Button>
                                    <Button variant="contained" onClick={() => setCafeStep(4)}
                                        sx={{ textTransform: 'none', borderRadius: 2, bgcolor: 'var(--color-primary)' }}>
                                        Next
                                    </Button>
                                </Box>
                            </Box>
                        </>
                    )}
                    {cafeStep === 4 && (
                        <>
                            <Typography sx={{ fontWeight: 700, mb: 2 }}>Capacity & Facilities</Typography>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={6}>
                                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Total Tables</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{ flex: 1, px: 1 }}>
                                                <input type="range" min="0" max="100" value={Number(cafeForm.totalTables) || 0}
                                                    onChange={e => setCafeForm({ ...cafeForm, totalTables: Number(e.target.value) })} style={{ width: '100%' }} />
                                            </Box>
                                            <TextField size="small" type="number" value={cafeForm.totalTables}
                                                onChange={e => setCafeForm({ ...cafeForm, totalTables: Number(e.target.value) })}
                                                sx={{ width: 110 }} />
                                        </Box>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Seating Capacity</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{ flex: 1, px: 1 }}>
                                                <input type="range" min="0" max="300" value={Number(cafeForm.seatingCapacity) || 0}
                                                    onChange={e => setCafeForm({ ...cafeForm, seatingCapacity: Number(e.target.value) })} style={{ width: '100%' }} />
                                            </Box>
                                            <TextField size="small" type="number" value={cafeForm.seatingCapacity}
                                                onChange={e => setCafeForm({ ...cafeForm, seatingCapacity: Number(e.target.value) })}
                                                sx={{ width: 110 }} />
                                        </Box>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12}>
                                    <Grid container spacing={2.5}>
                                        <Grid item xs={12} sm={4}>
                                            <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 3 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <DirectionsCar sx={{ color: '#5D4037' }} />
                                                    <Typography>Parking Available</Typography>
                                                </Box>
                                                <FormControlLabel control={<Checkbox checked={cafeForm.parkingAvailable}
                                                    onChange={e => setCafeForm({ ...cafeForm, parkingAvailable: e.target.checked })} />} label="" />
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 3 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Wifi sx={{ color: '#1565C0' }} />
                                                    <Typography>Free WiFi</Typography>
                                                </Box>
                                                <FormControlLabel control={<Checkbox checked={cafeForm.freeWifi}
                                                    onChange={e => setCafeForm({ ...cafeForm, freeWifi: e.target.checked })} />} label="" />
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 3 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <AcUnit sx={{ color: '#2e7d32' }} />
                                                    <Typography>Air Conditioned</Typography>
                                                </Box>
                                                <FormControlLabel control={<Checkbox checked={cafeForm.airConditioned}
                                                    onChange={e => setCafeForm({ ...cafeForm, airConditioned: e.target.checked })} />} label="" />
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Typography sx={{ fontWeight: 700, mb: 1 }}>Service Features</Typography>
                            <Grid container spacing={2.5} sx={{ mb: 2 }}>
                                <Grid item xs={12} sm={6}>
                                    <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                            <DeliveryDining sx={{ color: '#7f5539' }} />
                                            <Typography>Home Delivery</Typography>
                                        </Box>
                                        <FormControlLabel control={<Checkbox checked={cafeForm.hasHomeDelivery}
                                            onChange={e => setCafeForm({ ...cafeForm, hasHomeDelivery: e.target.checked })} />} label="" />
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                            <TakeoutDining sx={{ color: '#d4a373' }} />
                                            <Typography>Takeaway</Typography>
                                        </Box>
                                        <FormControlLabel control={<Checkbox checked={cafeForm.hasTakeaway}
                                            onChange={e => setCafeForm({ ...cafeForm, hasTakeaway: e.target.checked })} />} label="" />
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                            <Restaurant sx={{ color: '#3c2a21' }} />
                                            <Typography>Dine-In</Typography>
                                        </Box>
                                        <FormControlLabel control={<Checkbox checked={cafeForm.hasDineIn}
                                            onChange={e => setCafeForm({ ...cafeForm, hasDineIn: e.target.checked })} />} label="" />
                                    </Paper>
                                </Grid>
                            </Grid>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                                <Button variant="text" onClick={() => setCafeStep(3)} sx={{ textTransform: 'none' }}>
                                    Back
                                </Button>
                                <Button variant="contained" onClick={() => setCafeStep(5)}
                                    sx={{ textTransform: 'none', borderRadius: 2, bgcolor: 'var(--color-primary)' }}>
                                    Next
                                </Button>
                            </Box>
                        </>
                    )}
                    {cafeStep === 6 && (
                        <>
                            {cafeMeta.exists && (
                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Chip label={`Registered: ${cafeMeta.registrationDate || '-'}`} />
                                    <Chip label={`Status: ${cafeMeta.status || '-'}`} color="warning" />
                                    <Chip label={`Verification: ${cafeMeta.verificationStatus || '-'}`} color="info" />
                                </Box>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, mb: 2 }}>
                                <Button variant="text" onClick={() => setCafeStep(5)} sx={{ textTransform: 'none' }}>
                                    Back
                                </Button>
                                <Button type="submit" variant="contained" size="large" disabled={actionLoading}
                                    sx={{ py: 1.6, bgcolor: 'var(--color-primary)', textTransform: 'none', borderRadius: 2, fontWeight: 700 }}>
                                    {actionLoading ? <CircularProgress size={24} color="inherit" /> : (cafeMeta.exists ? 'Save Changes' : 'Register Café')}
                                </Button>
                            </Box>
                        </>
                    )}
                    {cafeStep === 5 && (
                        <>
                            {!cafeMeta.exists && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Please register the café first to upload photos.
                                </Alert>
                            )}
                            <Typography sx={{ fontWeight: 700, mb: 2 }}>Photos & Menu</Typography>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} md={6} lg={3}>
                                    <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Cafe Logo</Typography>
                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '2px dashed #e0e0e0', borderRadius: 2, p: 2, bgcolor: '#fcfaf7', mb: 2 }}>
                                            {!!cafeMeta.cafeLogo ? (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                                                    <Box sx={{ position: 'relative', width: 80, height: 80, borderRadius: 2, overflow: 'hidden', border: '1px solid #eee' }}>
                                                        <img src={resolveSrc(cafeMeta.cafeLogo)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo" />
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Button component="label" size="small" variant="outlined" startIcon={<Edit />} sx={{ textTransform: 'none' }}>
                                                            Change
                                                            <input hidden type="file" accept="image/*" onChange={e => uploadCafeFile('logo', e.target)} />
                                                        </Button>
                                                        <Button size="small" variant="outlined" color="error" startIcon={<Delete />} sx={{ textTransform: 'none' }} onClick={() => removeCafePhoto('logo', cafeMeta.cafeLogo)}>
                                                            Remove
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <>
                                                    <CloudUpload sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>No logo uploaded</Typography>
                                                    <Button component="label" variant="outlined" size="small" startIcon={<CloudUpload />} sx={{ textTransform: 'none' }} disabled={!cafeMeta.exists}>
                                                        Upload Logo
                                                        <input hidden type="file" accept="image/*" onChange={e => uploadCafeFile('logo', e.target)} />
                                                    </Button>
                                                </>
                                            )}
                                        </Box>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={6} lg={3}>
                                    <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                            <Typography sx={{ fontWeight: 700 }}>Exterior Photos</Typography>
                                            <IconButton component="label" size="small" sx={{ color: 'var(--color-primary)' }} disabled={!cafeMeta.exists}>
                                                <AddCircle />
                                                <input hidden type="file" multiple accept="image/*" onChange={e => uploadCafeFile('exterior', e.target)} />
                                            </IconButton>
                                        </Box>
                                        <Box onDragOver={e => e.preventDefault()} onDrop={e => handleDrop('exterior', e)}
                                            sx={{ flex: 1, border: '2px dashed #e0e0e0', borderRadius: 2, p: 2, textAlign: 'center', mb: 2, bgcolor: '#fcfaf7', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <CloudUpload sx={{ fontSize: 32, color: 'text.disabled', mb: 1, mx: 'auto' }} />
                                            <Typography variant="caption" color="text.secondary">Drag & drop images here</Typography>
                                        </Box>
                                        <Button component="label" variant="outlined" size="small" sx={{ textTransform: 'none' }} disabled={!cafeMeta.exists}>
                                            Upload
                                            <input hidden type="file" multiple accept="image/*" onChange={e => uploadCafeFile('exterior', e.target)} />
                                        </Button>
                                        {!!cafeMeta.exteriorPhoto && (
                                            <Grid container spacing={1} sx={{ mt: 1.5 }}>
                                                {cafeMeta.exteriorPhoto.split(',').slice(0, 4).map((p, i) => (
                                                    <Grid item key={i} xs={3}>
                                                        <Box sx={{ position: 'relative', pt: '100%', '&:hover .img-actions': { opacity: 1 } }}>
                                                            <img alt={"Exterior " + (i + 1)} src={resolveSrc(p)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} />
                                                            <Box className="img-actions" sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.4)', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                                                                <IconButton size="small" sx={{ color: 'white', p: 0.5 }} onClick={() => removeCafePhoto('exterior', p)}>
                                                                    <Delete sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                            </Box>
                                                        </Box>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        )}
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={6} lg={3}>
                                    <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                            <Typography sx={{ fontWeight: 700 }}>Interior Photos</Typography>
                                            <IconButton component="label" size="small" sx={{ color: 'var(--color-primary)' }} disabled={!cafeMeta.exists}>
                                                <AddCircle />
                                                <input hidden type="file" multiple accept="image/*" onChange={e => uploadCafeFile('interior', e.target)} />
                                            </IconButton>
                                        </Box>
                                        <Box onDragOver={e => e.preventDefault()} onDrop={e => handleDrop('interior', e)}
                                            sx={{ flex: 1, border: '2px dashed #e0e0e0', borderRadius: 2, p: 2, textAlign: 'center', mb: 2, bgcolor: '#fcfaf7', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <CloudUpload sx={{ fontSize: 32, color: 'text.disabled', mb: 1, mx: 'auto' }} />
                                            <Typography variant="caption" color="text.secondary">Drag & drop images here</Typography>
                                        </Box>
                                        <Button component="label" variant="outlined" size="small" sx={{ textTransform: 'none' }} disabled={!cafeMeta.exists}>
                                            Upload
                                            <input hidden type="file" multiple accept="image/*" onChange={e => uploadCafeFile('interior', e.target)} />
                                        </Button>
                                        {!!cafeMeta.interiorPhoto && (
                                            <Grid container spacing={1} sx={{ mt: 1.5 }}>
                                                {cafeMeta.interiorPhoto.split(',').slice(0, 4).map((p, i) => (
                                                    <Grid item key={i} xs={3}>
                                                        <Box sx={{ position: 'relative', pt: '100%', '&:hover .img-actions': { opacity: 1 } }}>
                                                            <img alt={"Interior " + (i + 1)} src={resolveSrc(p)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} />
                                                            <Box className="img-actions" sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.4)', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                                                                <IconButton size="small" sx={{ color: 'white', p: 0.5 }} onClick={() => removeCafePhoto('interior', p)}>
                                                                    <Delete sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                            </Box>
                                                        </Box>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        )}
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={6} lg={3}>
                                    <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Menu File</Typography>
                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '2px dashed #e0e0e0', borderRadius: 2, p: 2, bgcolor: '#fcfaf7', mb: 2 }}>
                                            {!!cafeMeta.menuFile ? (
                                                <>
                                                    <InsertDriveFile sx={{ fontSize: 40, color: 'var(--color-secondary)', mb: 1 }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 1.5, textAlign: 'center', wordBreak: 'break-all' }}>
                                                        {cafeMeta.menuFile.split('/').pop()}
                                                    </Typography>
                                                    <Button size="small" color="error" variant="outlined" startIcon={<Delete />} sx={{ textTransform: 'none' }} onClick={() => removeCafePhoto('menu', cafeMeta.menuFile)}>
                                                        Remove
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <CloudUpload sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>No menu uploaded</Typography>
                                                    <Button component="label" variant="outlined" size="small" startIcon={<CloudUpload />} sx={{ textTransform: 'none' }} disabled={!cafeMeta.exists}>
                                                        Upload Menu
                                                        <input hidden type="file" accept="image/*,application/pdf" onChange={e => uploadCafeFile('menu', e.target)} />
                                                    </Button>
                                                </>
                                            )}
                                        </Box>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12}>
                                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                                        <Typography sx={{ fontWeight: 700, mb: 2 }}>Food Photos</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <Button component="label" variant="outlined" startIcon={<CloudUpload />} sx={{ textTransform: 'none' }} disabled={!cafeMeta.exists}>
                                                Upload Food Photos
                                                <input hidden type="file" multiple accept="image/*" onChange={e => uploadCafeFile('food', e.target)} />
                                            </Button>
                                            <Typography variant="caption" color="text.secondary">Add appetizing photos of your dishes</Typography>
                                        </Box>
                                        {!!cafeMeta.foodPhotos && (
                                            <Grid container spacing={1.5}>
                                                {cafeMeta.foodPhotos.split(',').map((p, i) => (
                                                    <Grid item key={i} xs={6} sm={4} md={3} lg={2}>
                                                        <Box sx={{ position: 'relative', pt: '75%', '&:hover .img-actions': { opacity: 1 } }}>
                                                            <img alt={"Food " + (i + 1)} src={resolveSrc(p)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                                                            <Box className="img-actions" sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.4)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                                                                <IconButton size="small" sx={{ color: 'white' }} onClick={() => removeCafePhoto('food', p)}>
                                                                    <Delete fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        </Box>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        )}
                                    </Paper>
                                </Grid>
                                </Grid>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                                <Button variant="text" onClick={() => setCafeStep(4)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                                    Back
                                </Button>
                                <Button variant="contained" onClick={() => setCafeStep(6)}
                                    sx={{ 
                                        textTransform: 'none', 
                                        borderRadius: 2, 
                                        bgcolor: 'var(--color-primary)', 
                                        px: 4, 
                                        py: 1.2,
                                        fontWeight: 700,
                                        boxShadow: '0 4px 12px rgba(60, 42, 33, 0.2)',
                                        minWidth: 120
                                    }}>
                                    Next
                                </Button>
                            </Box>
                        </>
                    )}
                    {cafeStep === 1 && (
                        <>
                            <Typography sx={{ fontWeight: 700, mb: 2 }}>Address</Typography>
                            <Box className="pair-grid">
                                <Box>
                                    <TextField fullWidth required label="Street" value={cafeForm.street}
                                        onChange={e => setCafeForm({ ...cafeForm, street: e.target.value })} />
                                </Box>
                                <Box>
                                    <TextField fullWidth required label="City" value={cafeForm.city}
                                        onChange={e => setCafeForm({ ...cafeForm, city: e.target.value })} />
                                </Box>
                                <Box>
                                    <TextField fullWidth required label="State" value={cafeForm.state}
                                        onChange={e => setCafeForm({ ...cafeForm, state: e.target.value })} />
                                </Box>
                                <Box>
                                    <TextField fullWidth required label="Pincode" value={cafeForm.pincode}
                                        onChange={e => setCafeForm({ ...cafeForm, pincode: e.target.value })} />
                                </Box>
                                <Box sx={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                                    <Button variant="text" onClick={() => setCafeStep(0)} sx={{ textTransform: 'none' }}>
                                        Back
                                    </Button>
                                    <Button variant="contained" onClick={() => { if (validateAddress()) setCafeStep(2); }}
                                        sx={{ textTransform: 'none', borderRadius: 2, bgcolor: 'var(--color-primary)' }}>
                                        Next
                                    </Button>
                                </Box>
                            </Box>
                        </>
                    )}
                    {false && (
                        <>
                            <Divider sx={{ my: 3 }} />
                            <Typography sx={{ fontWeight: 700, mb: 2 }}>Capacity & Facilities</Typography>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="Total Tables" type="number" value={cafeForm.totalTables}
                                        onChange={e => setCafeForm({ ...cafeForm, totalTables: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="Seating Capacity" type="number" value={cafeForm.seatingCapacity}
                                        onChange={e => setCafeForm({ ...cafeForm, seatingCapacity: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', height: '100%' }}>
                                        <FormControlLabel control={<Checkbox checked={cafeForm.parkingAvailable}
                                            onChange={e => setCafeForm({ ...cafeForm, parkingAvailable: e.target.checked })} />} label="Parking" />
                                        <FormControlLabel control={<Checkbox checked={cafeForm.freeWifi}
                                            onChange={e => setCafeForm({ ...cafeForm, freeWifi: e.target.checked })} />} label="Free WiFi" />
                                        <FormControlLabel control={<Checkbox checked={cafeForm.airConditioned}
                                            onChange={e => setCafeForm({ ...cafeForm, airConditioned: e.target.checked })} />} label="AC" />
                                    </Box>
                                </Grid>
                            </Grid>
                            <Divider sx={{ my: 3 }} />
                            <Typography sx={{ fontWeight: 700, mb: 2 }}>Business Details</Typography>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth required label="Business Type" value={cafeForm.businessType}
                                        onChange={e => setCafeForm({ ...cafeForm, businessType: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth required label="FSSAI License Number" value={cafeForm.fssaiLicenseNumber}
                                        onChange={e => setCafeForm({ ...cafeForm, fssaiLicenseNumber: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="GST Number" value={cafeForm.gstNumber}
                                        onChange={e => setCafeForm({ ...cafeForm, gstNumber: e.target.value })} />
                                </Grid>
                            </Grid>
                            <Divider sx={{ my: 3 }} />
                            <Typography sx={{ fontWeight: 700, mb: 2 }}>Bank / Payments</Typography>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="Account Holder Name" value={cafeForm.accountHolderName}
                                        onChange={e => setCafeForm({ ...cafeForm, accountHolderName: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="Account Number" value={cafeForm.accountNumber}
                                        onChange={e => setCafeForm({ ...cafeForm, accountNumber: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="IFSC Code" value={cafeForm.ifscCode}
                                        onChange={e => setCafeForm({ ...cafeForm, ifscCode: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="UPI ID" value={cafeForm.upiId}
                                        onChange={e => setCafeForm({ ...cafeForm, upiId: e.target.value })} />
                                </Grid>
                            </Grid>
                            <Divider sx={{ my: 3 }} />
                            <Typography sx={{ fontWeight: 700, mb: 1 }}>Service Features</Typography>
                            <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                                <FormControlLabel control={<Checkbox checked={cafeForm.hasHomeDelivery}
                                    onChange={e => setCafeForm({ ...cafeForm, hasHomeDelivery: e.target.checked })} />} label="Home Delivery" />
                                <FormControlLabel control={<Checkbox checked={cafeForm.hasTakeaway}
                                    onChange={e => setCafeForm({ ...cafeForm, hasTakeaway: e.target.checked })} />} label="Takeaway" />
                                <FormControlLabel control={<Checkbox checked={cafeForm.hasDineIn}
                                    onChange={e => setCafeForm({ ...cafeForm, hasDineIn: e.target.checked })} />} label="Dine-In" />
                            </Box>
                            <Divider sx={{ my: 3 }} />
                            <Typography sx={{ fontWeight: 700, mb: 1 }}>Photos & Menu</Typography>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12} sm={6}>
                                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography sx={{ fontWeight: 700 }}>Cafe Logo</Typography>
                                            <CloudUpload sx={{ color: 'text.secondary' }} />
                                        </Box>
                                        <Box onDragOver={e => e.preventDefault()} onDrop={e => handleDrop('logo', e)}
                                            sx={{ border: '2px dashed #e0e0e0', borderRadius: 2, p: 2, textAlign: 'center', mb: 2, bgcolor: '#fcfaf7' }}>
                                            <Typography variant="caption" color="text.secondary">Drag & drop image here</Typography>
                                        </Box>
                                        <Button component="label" variant="outlined" sx={{ textTransform: 'none' }}>
                                            Upload
                                            <input hidden type="file" accept="image/*" onChange={e => uploadCafeFile('logo', e.target)} />
                                        </Button>
                                        {!!cafeMeta.cafeLogo && (
                                            <Box sx={{ mt: 1 }}>
                                                <img alt="Logo" src={resolveSrc(cafeMeta.cafeLogo)} style={{ height: 72, width: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                                            </Box>
                                        )}
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography sx={{ fontWeight: 700 }}>Exterior Photos</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CloudUpload sx={{ color: 'text.secondary' }} />
                                                <IconButton component="label" size="small" sx={{ color: 'var(--color-primary)' }}>
                                                    <AddCircle />
                                                    <input hidden type="file" multiple accept="image/*" onChange={e => uploadCafeFile('exterior', e.target)} />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                        <Box onDragOver={e => e.preventDefault()} onDrop={e => handleDrop('exterior', e)}
                                            sx={{ border: '2px dashed #e0e0e0', borderRadius: 2, p: 2, textAlign: 'center', mb: 2, bgcolor: '#fcfaf7' }}>
                                            <Typography variant="caption" color="text.secondary">Drag & drop multiple images here</Typography>
                                        </Box>
                                        <Button component="label" variant="outlined" sx={{ textTransform: 'none' }}>
                                            Upload
                                            <input hidden type="file" multiple accept="image/*" onChange={e => uploadCafeFile('exterior', e.target)} />
                                        </Button>
                                        {!!cafeMeta.exteriorPhoto && (
                                            <Grid container spacing={1.5} sx={{ mt: 1 }}>
                                                {cafeMeta.exteriorPhoto.split(',').map((p, i) => (
                                                    <Grid item key={i}>
                                                        <img alt={"Exterior " + (i + 1)} src={resolveSrc(p)} style={{ height: 72, width: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        )}
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography sx={{ fontWeight: 700 }}>Interior Photos</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CloudUpload sx={{ color: 'text.secondary' }} />
                                                <IconButton component="label" size="small" sx={{ color: 'var(--color-primary)' }}>
                                                    <AddCircle />
                                                    <input hidden type="file" multiple accept="image/*" onChange={e => uploadCafeFile('interior', e.target)} />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                        <Box onDragOver={e => e.preventDefault()} onDrop={e => handleDrop('interior', e)}
                                            sx={{ border: '2px dashed #e0e0e0', borderRadius: 2, p: 2, textAlign: 'center', mb: 2, bgcolor: '#fcfaf7' }}>
                                            <Typography variant="caption" color="text.secondary">Drag & drop multiple images here</Typography>
                                        </Box>
                                        <Button component="label" variant="outlined" sx={{ textTransform: 'none' }}>
                                            Upload
                                            <input hidden type="file" multiple accept="image/*" onChange={e => uploadCafeFile('interior', e.target)} />
                                        </Button>
                                        {!!cafeMeta.interiorPhoto && (
                                            <Grid container spacing={1.5} sx={{ mt: 1 }}>
                                                {cafeMeta.interiorPhoto.split(',').map((p, i) => (
                                                    <Grid item key={i}>
                                                        <img alt={"Interior " + (i + 1)} src={resolveSrc(p)} style={{ height: 72, width: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        )}
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography sx={{ fontWeight: 700 }}>Menu</Typography>
                                            <CloudUpload sx={{ color: 'text.secondary' }} />
                                        </Box>
                                        <Box onDragOver={e => e.preventDefault()} onDrop={e => handleDrop('menu', e)}
                                            sx={{ border: '2px dashed #e0e0e0', borderRadius: 2, p: 2, textAlign: 'center', mb: 2, bgcolor: '#fcfaf7' }}>
                                            <Typography variant="caption" color="text.secondary">Drag & drop file here</Typography>
                                        </Box>
                                        <Button component="label" variant="outlined" sx={{ textTransform: 'none' }}>
                                            Upload
                                            <input hidden type="file" accept="image/*,application/pdf" onChange={e => uploadCafeFile('menu', e.target)} />
                                        </Button>
                                        {!!cafeMeta.menuFile && <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>{cafeMeta.menuFile}</Typography>}
                                    </Paper>
                                </Grid>
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography sx={{ fontWeight: 700 }}>Food Photos</Typography>
                                            <PhotoLibrary sx={{ color: 'text.secondary' }} />
                                        </Box>
                                        <Box onDragOver={e => e.preventDefault()} onDrop={e => handleDrop('food', e)}
                                            sx={{ border: '2px dashed #e0e0e0', borderRadius: 2, p: 2, textAlign: 'center', mb: 2, bgcolor: '#fcfaf7' }}>
                                            <Typography variant="caption" color="text.secondary">Drag & drop multiple images here</Typography>
                                        </Box>
                                        <Button component="label" variant="outlined" sx={{ textTransform: 'none' }}>
                                            Upload
                                            <input hidden type="file" multiple accept="image/*" onChange={e => uploadCafeFile('food', e.target)} />
                                        </Button>
                                        {!!cafeMeta.foodPhotos && (
                                            <Grid container spacing={1.5} sx={{ mt: 1 }}>
                                                {cafeMeta.foodPhotos.split(',').map((p, i) => (
                                                    <Grid item key={i}>
                                                        <img alt={"Food " + (i + 1)} src={resolveSrc(p)} style={{ height: 72, width: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>
                        </>
                    )}

                </form>
            </Paper>
        </Box>
    );

    const renderOrders = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif", mb: 4 }}>
                Customer Orders
            </Typography>

            <Paper className="animate-slide-up" sx={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#fcfaf7' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Table</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((o) => (
                                <TableRow key={o.id}>
                                    <TableCell sx={{ fontWeight: 600 }}>#{o.id}</TableCell>
                                    <TableCell>{o.tableLabel || 'N/A'}</TableCell>
                                    <TableCell>{o.customerName || 'Guest'}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>₹{o.totalAmount || 0}</TableCell>
                                    <TableCell>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={(o.paymentStatus || 'pending').toUpperCase()}
                                            size="small"
                                            variant="outlined"
                                            color={
                                                o.paymentStatus === 'paid' ? 'success' :
                                                o.paymentStatus === 'failed' ? 'error' :
                                                'warning'
                                            }
                                            sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={o.status.toUpperCase()}
                                            size="small"
                                            color={
                                                o.status === 'completed' ? 'success' :
                                                o.status === 'cancelled' ? 'error' :
                                                o.status === 'ready' ? 'info' :
                                                'primary'
                                            }
                                            sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {o.status !== 'completed' && o.status !== 'cancelled' ? (
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => handleOrderStatusChange(o.id, 'completed')}
                                                sx={{
                                                    bgcolor: '#3c2a21',
                                                    color: 'white',
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    borderRadius: 2,
                                                    '&:hover': { bgcolor: '#513c31' }
                                                }}
                                            >
                                                Mark Complete
                                            </Button>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">
                                                Locked
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {orders.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No orders found.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );

    const renderProfile = () => (
        <Box className="animate-fade-in">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'var(--color-primary)', fontFamily: "'Playfair Display', serif" }}>
                    My Profile
                </Typography>
                {!isEditing && (
                    <Button 
                        variant="contained"
                        onClick={() => setIsEditing(true)}
                        startIcon={<Edit />}
                        sx={{ bgcolor: 'var(--color-primary)', color: 'white', '&:hover': { bgcolor: '#2C1E19' }, px: 3, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    >
                        Edit Profile
                    </Button>
                )}
            </Box>

            <Card sx={{ borderRadius: 4, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                <Box sx={{ p: 4, bgcolor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Avatar 
                        sx={{ width: 100, height: 100, bgcolor: 'var(--color-secondary)', color: 'var(--color-primary)', fontSize: '2.5rem', fontWeight: 800, border: '4px solid rgba(255,255,255,0.2)' }}
                    >
                        {userData.firstName?.[0]}{userData.lastName?.[0]}
                    </Avatar>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'white' }}>
                            {userData.firstName || 'User'} {userData.lastName || ''}
                        </Typography>
                        <Chip 
                            label="Café Owner" 
                            sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700, border: '1px solid rgba(255,255,255,0.3)' }} 
                            size="small" 
                        />
                    </Box>
                </Box>
                
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 4, color: 'var(--color-primary)' }}>
                        {isEditing ? 'Update Personal Information' : 'Personal Information'}
                    </Typography>
                    
                    {isEditing ? (
                        <Box component="form" onSubmit={handleProfileUpdate}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="First Name" value={profileForm.firstName} onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})} required />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Last Name" value={profileForm.lastName} onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})} required />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth type="date" label="Date of Birth" InputLabelProps={{ shrink: true }} value={profileForm.dob} onChange={(e) => setProfileForm({...profileForm, dob: e.target.value})} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Gender</InputLabel>
                                        <Select value={profileForm.gender} label="Gender" onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}>
                                            <MenuItem value="male">Male</MenuItem>
                                            <MenuItem value="female">Female</MenuItem>
                                            <MenuItem value="other">Other</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Phone Number" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="Plot No" value={profileForm.plotNo} onChange={(e) => setProfileForm({...profileForm, plotNo: e.target.value})} />
                                </Grid>
                                <Grid item xs={12} sm={8}>
                                    <TextField fullWidth label="Street" value={profileForm.street} onChange={(e) => setProfileForm({...profileForm, street: e.target.value})} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="City" value={profileForm.city} onChange={(e) => setProfileForm({...profileForm, city: e.target.value})} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Pincode" value={profileForm.pincode} onChange={(e) => setProfileForm({...profileForm, pincode: e.target.value})} />
                                </Grid>
                            </Grid>
                            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                                <Button type="submit" variant="contained" sx={{ bgcolor: 'var(--color-primary)', color: 'white', px: 4, py: 1, borderRadius: 2, fontWeight: 800 }}>Save Changes</Button>
                                <Button onClick={() => setIsEditing(false)} variant="outlined" sx={{ px: 4, py: 1, borderRadius: 2, fontWeight: 800 }}>Cancel</Button>
                            </Box>
                        </Box>
                    ) : (
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Email sx={{ color: 'var(--color-secondary)' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Email Address</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{userData.email}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Phone sx={{ color: 'var(--color-secondary)' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{userData.phone || 'N/A'}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <CalendarMonth sx={{ color: 'var(--color-secondary)' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{userData.dob || 'N/A'}</Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Wc sx={{ color: 'var(--color-secondary)' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Gender</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{userData.gender || 'N/A'}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <LocationOn sx={{ color: 'var(--color-secondary)' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Location</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {[userData.plotNo, userData.street, userData.city, userData.pincode].filter(Boolean).join(', ') || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>
                    )}
                </CardContent>
            </Card>
        </Box>
    );


    // ── Guard ───────────────────────────────────────────────────────────────
    if (!token) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h5" color="error">Access Denied</Typography>
                <Button variant="contained" onClick={() => navigate('/login')} sx={{ bgcolor: 'var(--color-primary)' }}>
                    Go to Login
                </Button>
            </Box>
        );
    }

    return (
        <Box className="animate-fade-in" sx={{ display: 'flex', bgcolor: 'var(--color-bg)', minHeight: '100vh' }}>
            {/* ── Sidebar ─────────────────────────────────────────────── */}
            <Drawer variant="permanent" sx={{
                width: DRAWER_WIDTH, flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH, boxSizing: 'border-box',
                    bgcolor: 'rgba(60,42,33,0.96)', color: 'white',
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: 'var(--shadow-lg)'
                }
            }}>
                {/* Brand */}
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, mb: 3, mt: 1 }}>
                    <Box sx={{ bgcolor: 'var(--color-secondary)', p: 1, borderRadius: 2, display: 'flex' }}>
                        <Coffee sx={{ fontSize: 26, color: 'white' }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "'Playfair Display', serif", color: 'white', lineHeight: 1 }}>
                            Coffee House
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                            Owner Portal
                        </Typography>
                    </Box>
                </Box>

                {/* Owner info pill */}
                <Box sx={{ mx: 2, mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Logged in as
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, mt: 0.3 }}>
                        {userData.firstName} {userData.lastName || ''}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--color-secondary)' }}>Café Owner</Typography>
                </Box>

                {/* Nav */}
                <List sx={{ px: 2 }}>
                    {navItems.map(item => {
                        const isActive = activeTab === item.id || (item.id === 'staff' && activeTab === 'add');
                        return (
                            <ListItem button key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                sx={{
                                    borderRadius: 2, mb: 0.8, py: 1.2, cursor: 'pointer',
                                    bgcolor: isActive ? 'rgba(212,163,115,0.2)' : 'transparent',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                                    transition: 'all 0.2s ease'
                                }}>
                                <ListItemIcon sx={{ color: isActive ? 'var(--color-secondary)' : 'rgba(255,255,255,0.7)', minWidth: 42 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontWeight: isActive ? 700 : 500,
                                        fontSize: '0.95rem',
                                        color: isActive ? 'white' : 'rgba(255,255,255,0.75)'
                                    }}
                                />
                            </ListItem>
                        );
                    })}
                </List>

                {/* Logout */}
                <Box sx={{ mt: 'auto', p: 3 }}>
                    <Button fullWidth variant="outlined" color="inherit" startIcon={<Logout />}
                        onClick={() => setLogoutDialogOpen(true)}
                        sx={{
                            borderColor: 'rgba(255,255,255,0.25)', borderRadius: 2, textTransform: 'none',
                            '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' }
                        }}>
                        Logout
                    </Button>
                </Box>
            </Drawer>

            {/* ── Main content ─────────────────────────────────────────── */}
            <Box component="main" className="animate-slide-up" sx={{ flexGrow: 1, p: 4, bgcolor: '#fcfaf7', minHeight: '100vh' }}>
                {/* Global alerts at top */}
                {activeTab !== 'add' && error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
                {activeTab !== 'add' && successMsg && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
                        <CircularProgress sx={{ color: 'var(--color-primary)' }} />
                    </Box>
                ) : (
                    <>
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'cafe' && renderCafe()}
                        {activeTab === 'tables' && renderTables()}
                        {activeTab === 'orders' && renderOrders()}
                        {activeTab === 'menu' && renderMenu()}
                        {activeTab === 'staff' && renderStaff()}
                        {activeTab === 'add' && renderAddStaff()}
                        {activeTab === 'profile' && renderProfile()}
                    </>
                )}
            </Box>

            {/* ── Delete confirmation dialog ────────────────────────────── */}
            <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    Remove Staff Member?
                </DialogTitle>
                <DialogContent>
                    <Typography>This will permanently remove this staff member from your café. They will no longer be able to log in.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteConfirm(null)} variant="text">Cancel</Button>
                    <Button
                        onClick={() => handleDelete(deleteConfirm)}
                        variant="contained"
                        color="error"
                        disabled={actionLoading}
                    >
                        {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Remove'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Logout confirmation dialog ────────────────────────────── */}
            <Dialog
                open={logoutDialogOpen}
                onClose={() => setLogoutDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 400 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: 'var(--color-primary)', textAlign: 'center', pb: 1 }}>
                    Confirm Logout
                </DialogTitle>
                <DialogContent>
                    <Typography textAlign="center" color="text.secondary">
                        Are you sure you want to log out? You will need to sign in again to access your account.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, px: 3 }}>
                    <Button
                        onClick={() => setLogoutDialogOpen(false)}
                        sx={{ textTransform: 'none', fontWeight: 700, color: 'text.secondary', px: 3 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleLogout}
                        variant="contained"
                        sx={{
                            bgcolor: 'var(--color-primary)',
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 4,
                            '&:hover': { bgcolor: '#2C1E19' }
                        }}
                    >
                        Yes, Logout
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default CafeOwnerDashboard;
