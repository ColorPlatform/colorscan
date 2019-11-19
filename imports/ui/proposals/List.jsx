import React, { Component } from 'react';
import moment from 'moment';
import { Table, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { DenomSymbol, ProposalStatusIcon } from '../components/Icons.jsx';
import numbro from 'numbro';
import i18n from 'meteor/universe:i18n';

const T = i18n.createComponent();

const ProposalRow = (props) => {
    return <tr>
        <th className="counter">{props.proposal.proposalId}</th>
        <td className="title"><Link to={"/proposals/"+props.proposal.proposalId}>{props.proposal.proposal_content.value.title}</Link></td>
        <td className="status"><ProposalStatusIcon status={props.proposal.proposal_status}/><span>{props.proposal.proposal_status.match(/[A-Z]+[^A-Z]*|[^A-Z]+/g).join(" ")}</span></td>
        <td className="submit-block">{moment.utc(props.proposal.submit_time).format("D MMM YYYY, h:mm:ssa")}</td>
        <td className="fundingcycle">{props.proposal.proposal_content.value.funding_cycle?props.proposal.proposal_content.value.funding_cycle:'0'}</td>
        <td className="deposit">{props.proposal.proposal_content.value.requested_fund?props.proposal.proposal_content.value.requested_fund.map((deposit, i) => {
            return <div key={i}>{numbro(deposit.amount/Meteor.settings.public.stakingFraction).format('0,0')} {Meteor.settings.public.stakingDenom}</div>
        }):'0 CLR'}</td>
    </tr>
}

export default class List extends Component{
    constructor(props){
        super(props);
        if (Meteor.isServer){
            if (this.props.proposals.length > 0){
                this.state = {
                    proposals: this.props.proposals.map((proposal, i) => {
                        return <ProposalRow key={i} index={i} proposal={proposal} />
                    })
                }
            }
        }
        else{
            this.state = {
                proposals: null
            }
        }
    }

    componentDidUpdate(prevState){
        if (this.props.proposals != prevState.proposals){
            if (this.props.proposals.length > 0){
                this.setState({
                    proposals: this.props.proposals.map((proposal, i) => {
                        return <ProposalRow key={i} index={i} proposal={proposal} />
                    })
                })
            }
        }
    }

    render(){
        if (this.props.loading){
            return <Spinner type="grow" color="primary" />
        }
        else if (!this.props.proposalsExist){
            return <div><T>No Proposal Found</T></div>
        }
        else{
            return <div id="proposals-table" className="proposal-table">
                <Table striped className="proposal-list table-responsive">
                    <thead>
                        <tr>
                            <th className="counter"><i className="fas fa-hashtag"></i><T>proposals.proposalID</T></th>
                            <th className="title"><i className="fas fa-bars"></i><T>proposals.title</T></th>
                            <th className="status"><i className="fas fa-toggle-on"></i><T>proposals.status</T></th>
                            <th className="submit-block"><i className="fas fa-box"></i><T>proposals.submitTime</T> (UTC)</th>
                            <th className="voting-start"><i className="fas fa-box-open"></i><T>proposals.fundingCycle</T></th>
                            <th className="deposit"><i className="fas fa-dollar-sign"></i><T>proposals.requestedFund</T></th>
                        </tr>
                    </thead>
                    <tbody>{this.state.proposals}</tbody>
                </Table>
                </div>
        }
    }
}