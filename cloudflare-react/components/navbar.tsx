// import * as React from 'react';
// import { Box, List, ListItem, ListItemButton, ListItemText, IconButton, Drawer, Typography } from '@mui/material';
// import { Link, useLocation } from 'react-router-dom';
// import MenuIcon from '@mui/icons-material/Menu';
// import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

// const Sidebar: React.FC = () => {
//     const [open, setOpen] = React.useState(false);
//     const location = useLocation();

//     const handleDrawerOpen = () => {
//         setOpen(true);
//     };

//     const handleDrawerClose = () => {
//         setOpen(false);
//     };

//     // Функция для проверки активности страницы
//     const isActive = (path: string) => {
//         if (path === '/' && location.pathname === '/') {
//             return true;
//         }
//         if (path !== '/' && location.pathname.startsWith(path)) {
//             return true;
//         }
//         return false;
//     };

//     return (
//         <>
//             {/* Кнопка открытия сайдбара */}
//             <IconButton
//                 color="primary"
//                 aria-label="open drawer"
//                 onClick={handleDrawerOpen}
//                 edge="start"
//                 sx={{
//                     position: 'fixed',
//                     left: 12,
//                     top: 12,
//                     zIndex: 1200,
//                     display: open ? 'none' : 'flex',
//                     border: '1px solid rgba(0, 0, 0, 0.12)',
//                     background: '#fff'
//                 }}
//             >
//                 <MenuIcon />
//             </IconButton>

//             {/* Сайдбар */}
//             <Drawer
//                 variant="persistent"
//                 anchor="left"
//                 open={open}
//                 sx={{
//                     '& .MuiDrawer-paper': {
//                         width: 240,
//                         boxSizing: 'border-box',
//                         borderRadius: 0,
//                         boxShadow: 'none',
//                         border: 'none',
//                         borderRight: '1px solid rgba(0, 0, 0, 0.08)',
//                         bgcolor: '#fafafa'
//                     },
//                 }}
//             >
//                 <Box sx={{ 
//                     display: 'flex', 
//                     alignItems: 'center', 
//                     justifyContent: 'space-between',
//                     p: 2,
//                     borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
//                 }}>
//                     <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
//                         Меню
//                     </Typography>
//                     <IconButton onClick={handleDrawerClose}>
//                         <ChevronLeftIcon />
//                     </IconButton>
//                 </Box>

//                 <List sx={{ p: 1 }}>
//                     <ListItem disablePadding>
//                         <ListItemButton 
//                             component={Link} 
//                             to="/"
//                             sx={{ 
//                                 py: 1.5,
//                                 borderRadius: 0,
//                                 mb: 0.5,
//                                 position: 'relative',
//                                 '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
//                                 '&::after': isActive('/') ? {
//                                     content: '""',
//                                     position: 'absolute',
//                                     bottom: 0,
//                                     left: 0,
//                                     width: '100%',
//                                     height: '2px',
//                                     bgcolor: 'primary.main'
//                                 } : {}
//                             }}
//                         >
//                             <ListItemText 
//                                 primary="Документація" 
//                                 primaryTypographyProps={{ 
//                                     fontSize: 14,
//                                     fontWeight: isActive('/') ? 500 : 400 
//                                 }}
//                             />
//                         </ListItemButton>
//                     </ListItem>
                    
//                     <ListItem disablePadding>
//                         <ListItemButton 
//                             component={Link} 
//                             to="/pages/page_three"
//                             sx={{ 
//                                 py: 1.5,
//                                 borderRadius: 0,
//                                 mb: 0.5,
//                                 position: 'relative',
//                                 '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
//                                 '&::after': isActive('/pages/page_three') ? {
//                                     content: '""',
//                                     position: 'absolute',
//                                     bottom: 0,
//                                     left: 0,
//                                     width: '100%',
//                                     height: '2px',
//                                     bgcolor: 'primary.main'
//                                 } : {}
//                             }}
//                         >
//                             <ListItemText 
//                                 primary="Сторінка 3" 
//                                 primaryTypographyProps={{ 
//                                     fontSize: 14,
//                                     fontWeight: isActive('/pages/page_three') ? 500 : 400 
//                                 }}
//                             />
//                         </ListItemButton>
//                     </ListItem>
                    
//                     <ListItem disablePadding>
//                         <ListItemButton 
//                             component={Link} 
//                             to="/pages/page_four"
//                             sx={{ 
//                                 py: 1.5,
//                                 borderRadius: 0,
//                                 mb: 0.5, 
//                                 position: 'relative',
//                                 '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
//                                 '&::after': isActive('/pages/page_four') ? {
//                                     content: '""',
//                                     position: 'absolute',
//                                     bottom: 0,
//                                     left: 0,
//                                     width: '100%',
//                                     height: '2px',
//                                     bgcolor: 'primary.main'
//                                 } : {}
//                             }}
//                         >
//                             <ListItemText 
//                                 primary="Сторінка 4" 
//                                 primaryTypographyProps={{ 
//                                     fontSize: 14,
//                                     fontWeight: isActive('/pages/page_four') ? 500 : 400 
//                                 }}
//                             />
//                         </ListItemButton>
//                     </ListItem>
                    
//                     <ListItem disablePadding>
//                         <ListItemButton 
//                             component={Link} 
//                             to="/pages/page_five"
//                             sx={{ 
//                                 py: 1.5,
//                                 borderRadius: 0,
//                                 position: 'relative',
//                                 '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
//                                 '&::after': isActive('/pages/page_five') ? {
//                                     content: '""',
//                                     position: 'absolute',
//                                     bottom: 0,
//                                     left: 0,
//                                     width: '100%',
//                                     height: '2px',
//                                     bgcolor: 'primary.main'
//                                 } : {}
//                             }}
//                         >
//                             <ListItemText 
//                                 primary="Сторінка 5" 
//                                 primaryTypographyProps={{ 
//                                     fontSize: 14,
//                                     fontWeight: isActive('/pages/page_five') ? 500 : 400 
//                                 }}
//                             />
//                         </ListItemButton>
//                     </ListItem>
//                 </List>
//             </Drawer>
//         </>
//     );
// };

// export default Sidebar;