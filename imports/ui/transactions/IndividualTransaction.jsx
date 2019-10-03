import React from 'react';
import { Row, Col, Card } from 'reactstrap';
import TransactionActivities from '../components/TransactionActivities.jsx'

export const IndividualTransaction = (props) => {
    let tx = props.tx;
    // console.log(tx);
    return <Row className={(tx.code)?"tx-info invalid":"tx-info"}>
        <Col className="activity">{(tx.tx.value.msg && tx.tx.value.msg.length >0)?tx.tx.value.msg.map((msg,i) => {
            return <Card body key={i}><TransactionActivities msg={msg} invalid={(!!tx.code)} tags={tx.tags} /></Card>
        }):''}</Col>
    </Row>
}