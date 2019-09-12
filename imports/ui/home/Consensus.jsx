import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, CardImg, CardText, CardBody,
    CardTitle, CardSubtitle, Button, Progress, Spinner } from 'reactstrap';
import Avatar from '../components/Avatar.jsx';
import CountDown from '../components/CountDown.jsx';
import moment from 'moment';
import numbro from 'numbro';
import i18n from 'meteor/universe:i18n';

const T = i18n.createComponent();
export default class Consensus extends Component{
    constructor(props){
        super(props);
        // this.state = {
        //     chainStopped: false,
        // }
    }

    // componentDidUpdate(prevProps){
    //     if (prevProps.consensus != this.props.consensus){
    //         if (this.props.consensus.latestBlockTime){
    //             // console.log()
    //             let lastSync = moment(this.props.consensus.latestBlockTime);
    //             let current = moment();
    //             let diff = current.diff(lastSync);
    //             if (diff > 60000){
    //                 this.setState({
    //                     chainStopped:true
    //                 })
    //             }
    //             else{
    //                 this.setState({
    //                     chainStopped:false
    //                 })
    //             }
    //         }
    //     }
    // }

    render(){
        if (this.props.loading){
            return <Spinner type="grow" color="primary" />
        }
        else{
            if (this.props.consensusExist && this.props.consensus.prevotes){
                let proposer = this.props.consensus.proposer();
                let moniker = (proposer&&proposer.description&&proposer.description.moniker)?proposer.description.moniker:this.props.consensus.proposerAddress;
                let identity = (proposer&&proposer.description&&proposer.description.identity)?proposer.description.identity:"";
                return (
                    <div>
                        {/* {(this.state.chainStopped)?<Card body inverse color="danger">
                            <span><T _purify={false} time={moment(this.props.consensus.latestBlockTime).fromNow(true)}>chainStatus.stopWarning</T></span>             
                        </Card>:''} */}
                        {/* <Card className="status consensus-state"> */}
                            {/* <div className="card-header"><T>consensus.consensusState</T></div> */}
                            {/* <CardBody className="shade"> */}
                                        <Row className="status text-center">
                                            <Col md={6}>
                                                <Card body className="shade">
                                                <Row>
                                                    <Col md={12} xs={4}><CardSubtitle className="display"><T>common.height</T></CardSubtitle></Col>
                                                    <Col md={12} xs={8}><span className="value">{numbro(this.props.consensus.votingHeight).format('0,0')}</span></Col>
                                                </Row>
                                                </Card>
                                            </Col>
                                            <Col md={6}>
                                            <Card body className="shade">
                                                <Row>
                                                    <Col md={12} xs={4}><CardSubtitle className="display"><T>consensus.round</T></CardSubtitle></Col>
                                                    <Col md={12} xs={8}><span className="value">{this.props.consensus.votingRound}</span></Col>
                                                </Row>
                                                </Card>
                                            </Col>
                                        </Row>
                                        <Row className="status text-center">
                                            <Col md={6}>
                                            <Card body className="shade">
                                                <Row>   
                                                    <Col md={12} xs={4}><CardSubtitle className="display"><T>consensus.step</T></CardSubtitle></Col>
                                                    <Col md={12} xs={8}><span className="value">{this.props.consensus.votingStep}</span></Col>
                                                </Row>
                                                </Card>
                                            </Col>
                                            <Col md={6}>
                                            <Card body className="shade">
                                                <Row>
                                                    <Col md={12} xs={4}><CardSubtitle className="display"><T>blocks.proposer</T></CardSubtitle></Col>
                                                    <Col md={12} xs={8}><span className="value text-truncate"><Link to={"/validator/"+this.props.consensus.proposerAddress} ><Avatar moniker={moniker} identity={identity} address={this.props.consensus.proposerAddress} list={true} />{moniker}</Link></span></Col>
                                                </Row>
                                                </Card>
                                            </Col>
                                        </Row>                            
                                   
                                    <Row>
                                        <Col md={12}>
                                        <Card body className="shade">
                                            <CardSubtitle><T>common.votingPower</T></CardSubtitle><Progress animated value={this.props.consensus.votedPower} className="value">{this.props.consensus.votedPower}%</Progress>
                                        </Card>
                                        </Col>
                                    </Row>
                            {/* </CardBody>
                        </Card> */}
                    </div>);
            }
            else{
                let genesisTime = moment(Meteor.settings.public.genesisTime);
                let current = moment();
                let diff = genesisTime.diff(current);
        
                return <div className="text-center"><Card body inverse color="danger">
                    <span><T>chainStatus.startMessage</T></span>             
                </Card>
                <CountDown genesisTime={diff/1000}/>
                </div>
            }   
        }
    }
}