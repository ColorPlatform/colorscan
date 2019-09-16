import React from 'react';
import {
    Navbar,
    Nav,
    NavItem,
    NavLink } from 'reactstrap';

import { Link } from 'react-router-dom';
import moment from 'moment';
import i18n from 'meteor/universe:i18n';

const T = i18n.createComponent();

export default class Footer extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <Navbar light expand="md" fixed="bottom" id="footer" className="d-md-flex footer-color">
                    <span className="text-muted">All rights reserved &copy;{moment().format('YYYY')}</span>
                    <Nav className="ml-auto" navbar>
                        <NavItem>
                            <NavLink className="white">Color Platform</NavLink>
                        </NavItem>
                    </Nav>
                </Navbar>
                <Navbar color="light" light fixed="bottom" className="d-block d-md-none mobile-menu">
                    <Nav>
                        <NavItem>
                            <NavLink tag={Link} to="/"><i className="fa fa-fw fa-home" /></NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink tag={Link} to="/validators"><i className="fa fa-fw fa-spinner" /></NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink tag={Link} to="/blocks"><i className="fa fa-fw fa-cube" /></NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink tag={Link} to="/transactions"><i className="fa fa-fw fa-random" /></NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink tag={Link} to="/proposals"><i className="fa fa-fw fa-edit" /></NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink tag={Link} to="/voting-power-distribution"><i className="fa fa-fw fa-chart-bar" /></NavLink>
                        </NavItem>
                    </Nav>
                </Navbar>
            </div>  
        );
    }
}