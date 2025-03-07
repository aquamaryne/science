import * as React from 'react';
import { Button, Grid } from '@mui/material';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
    return (
        <Grid container justifyContent="center" spacing={2} sx={{ padding: 2 }}>
            <Grid item>
                <Link to='/'>
                    <Button variant="contained" sx={{ boxShadow: 3, '&:active': { boxShadow: 1 } }}>
                        Документація
                    </Button>
                </Link>
            </Grid>
            <Grid item>
                <Link to='/pages/page_three'>
                    <Button variant="contained" sx={{ boxShadow: 3, '&:active': { boxShadow: 1 } }}>
                        Сторінка 3
                    </Button>
                </Link>
            </Grid>
            <Grid item>
                <Link to='/pages/page_four'>
                    <Button variant="contained" sx={{ boxShadow: 3, '&:active': { boxShadow: 1 } }}>
                        Сторінка 4
                    </Button>
                </Link>
            </Grid>
            <Grid item>
                <Link to='/pages/page_five'>
                    <Button variant="contained" sx={{ boxShadow: 3, '&:active': { boxShadow: 1 } }}>
                        Сторінка 5
                    </Button>
                </Link>
            </Grid>
        </Grid>
    );
};

export default Navbar;