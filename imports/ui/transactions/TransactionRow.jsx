import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Alert, Spinner } from 'reactstrap';
import { TxIcon } from '../components/Icons.jsx';
import Activities from '../components/Activities.jsx';
import ColorErrors from '../components/ColorErrors.jsx';
import ButtonActivities from '../components/ButtonActivities.jsx';
import TimeAgo from '../components/TimeAgo.jsx';
import numbro from 'numbro';
import moment from 'moment';
import Coin from '/both/utils/coins.js'

export const TransactionRow = (props) => {
    let tx = props.tx;
    // console.log(tx);
    return <Row className={(tx.code)?"tx-info invalid":"tx-info"}>
        {(!props.blockList)?<Col xs={5} md={2}>{(tx.tx.value.msg && tx.tx.value.msg.length >0)?tx.tx.value.msg.map((msg) => {
            return <p><ButtonActivities msg={msg} invalid={(!!tx.code)} tags={tx.tags} /></p>
        }):''}</Col>:''}
        
        <Col className="resultpaddingleft" xs={(!props.blockList)?3:3} md={1}>{(!tx.code)?<TxIcon valid />:<TxIcon />}</Col>

        {(!props.blockList)?<Col xs={3} md={2}>{(tx.tx.value.msg && tx.tx.value.msg.length >0)?tx.tx.value.msg.map((msg) => {
            return <Activities msg={msg} invalid={(!!tx.code)} tags={tx.tags} />
        }):''}</Col>:''}

        <Col xs={(!props.blockList)?3:2} md={(!props.blockList)?2:2} className="fee"><i className="material-icons d-lg-none">monetization_on</i> {tx.tx.value.fee.amount?tx.tx.value.fee.amount.map((fee,i) => {
            return <span key={i}>{new Coin(fee.amount).toString()}</span>
            {/* {numbro(fee.amount).format(0,0)} CLR</span> */}
        }):<span>No fee</span>}</Col>
        {(!props.blockList)?<Col xs={2} md={2}><i className="fas fa-database d-lg-none"></i> <Link to={"/blocks/"+tx.height}>{numbro(tx.height).format("0,0")}</Link></Col>:''}
        <Col xs={(!props.blockList)?{size:4,order:"first"}:{size:12,order:"first"}} md={(!props.blockList)?{size:3, order: "first"}:{size:7, order: "first"}} lg={(!props.blockList)?{size:1,order:"first"}:{size:2,order:"first"}} className="text-truncate"><i className="fas fa-hashtag d-lg-none"></i> <Link to={"/transactions/"+tx.txhash}>{tx.txhash}</Link></Col>
        {(!props.blockList)?<Col xs={2} md={2}><span>{tx.block()?moment.utc(tx.block().time).format("D MMM YYYY, h:mm:ssa"):''}</span></Col>:''}
                                            {/* className="text-nowrap"                   <TimeAgo time={tx.block().time} /> */}
        {(tx.code)?<Col xs={{size:12, order:"last"}} className="error">
            <Alert color="danger">
                <ColorErrors 
                    code={tx.code}
                    logs={tx.logs}
                    gasWanted={tx.gas_wanted}
                    gasUses={tx.gas_used}
                />
            </Alert>
        </Col>:''}

    </Row>
}