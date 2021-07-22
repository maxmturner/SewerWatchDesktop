import React from 'react';
import {Modal, Button} from 'react-bootstrap';

function SWModal(props) {
    const {show, backdrop, title, body, close, submit, submitDisabled, closeDisabled } = props;
    
    return (
    <Modal
        show={show}
        backdrop={backdrop}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
    >
        <Modal.Header>
            <Modal.Title id="contained-modal-title-vcenter">
                {title}
            </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {body.map((item, index) => {
                if(index === 0){
                    return <h5>{item}</h5>
                }else if(item.includes("Warning")) {
                    return <p><b>{item}</b></p>
                } else {
                    return <p>{item}</p>
                }
            })
            }
        </Modal.Body>
        <Modal.Footer>
            {closeDisabled ? null : <Button variant="secondary" onClick={() => {close()} }>Close</Button> }
            {submitDisabled ? null : <Button variant="danger" onClick={() => {submit()} }>Submit</Button> }
        </Modal.Footer>
    </Modal>
    );
}

export default SWModal;