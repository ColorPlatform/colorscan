import React, { Component } from 'react';
import moment from 'moment';
import { Table, Spinner } from 'reactstrap';
import i18n from 'meteor/universe:i18n';

const T = i18n.createComponent();

const ProposalRow = (props) => {
    console.log(this.props)
    return <tr>
        <th className="counter">{props.fundingCycle.cycle_id}</th>
        <td className="submit-block">{moment.utc(props.fundingCycle.cycle_start_time).format("D MMM YYYY, h:mm:ssa")}</td>
        <td className="voting-start">{moment.utc(props.fundingCycle.cycle_end_time).format("D MMM YYYY, h:mm:ssa")}</td>
    </tr>
}

export default class List extends Component{
    constructor(props){
        super(props);
        if (Meteor.isServer){
            if (this.props.fundingCycles.length > 0){
                this.state = {
                    fundingCycles: this.props.fundingCycles.map((fundingCycle, i) => {
                        return <ProposalRow key={i} index={i} fundingCycle={fundingCycle} />
                    })
                }
            }
        }
        else{
            this.state = {
                fundingCycles: null
            }
        }
    }

    componentDidUpdate(prevState){
        if (this.props.fundingCycles != prevState.fundingCycles){
            if (this.props.fundingCycles.length > 0){
                this.setState({
                    fundingCycles: this.props.fundingCycles.map((fundingCycle, i) => {
                        return <ProposalRow key={i} index={i} fundingCycle={fundingCycle} />
                    })
                })
            }
        }
    }

    render(){
        if (this.props.loading){
            return <Spinner type="grow" color="primary" />
        }
        else if (!this.props.fundingCyclesExist){
            return <div><T>No Funding Cycle Found</T></div>
        }
        else{
            return <div id="proposals-table" className="proposal-table">
                <Table striped className="proposal-list table-responsive">
                    <thead>
                        <tr>
                            <th className="counter"><i className="fas fa-hashtag"></i><T>fundingcycles.cycleID</T></th>
                            <th className="submit-block"><i className="fas fa-box"></i><T>fundingcycles.cycleStartTime</T> (UTC)</th>
                            <th className="voting-start"><i className="fas fa-box-open"></i><T>fundingcycles.cycleEndTime</T> (UTC)</th>
                        </tr>
                    </thead>
                    <tbody>{this.state.fundingCycles}</tbody>
                </Table>
                </div>
        }
    }
}