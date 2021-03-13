import { Col, List, Row } from 'antd'
import Axios from 'axios'
import React, { useEffect, useState } from 'react'
import './GameDetailPage.css';

function GameDetailPage(props) {

  // url에 적혀있는 gameId 가져오자
  const gameId = props.match.params.gameId
  const variable = { gameId: gameId }
  
  const [gameDetail, setGameDetail] = useState([]);

  useEffect(() => {
    Axios.post('/api/game/getgamedetail',variable)
    .then(response => {
      if(response.data.success) {
        setGameDetail(response.data.gameDetail);
      } else {
        alert('게임 정보를 로딩하는데 실패했습니다.')
      }
    })
  },[])

  //? gameDetail에 정보 담겨있습니다!
  console.log(gameDetail)

  return (
    <div>
      <h2>game detail page</h2>
      console창 보시면 정보 받아지고 있습니다! (전부 다 보내진 않고 있음)
      정리해서 사용하세요.
    </div>
  )
}

export default GameDetailPage