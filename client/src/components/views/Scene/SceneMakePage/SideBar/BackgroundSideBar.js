import { Button } from 'antd';
import React from 'react'
import BackgroundImg from './BackgroundImg'
import './BackgroundSideBar.css'

function BackgroundSideBar({ gameDetail, setBackgroundImg, setMakeModalState }) {

  const renderBackground = gameDetail.background.map((background, index) => {
    return <div className="background" key={`${index}`}>
      <BackgroundImg imgUrl={background.image} setBackgroundImg={setBackgroundImg} />
    </div>
  })

  return (
    <div className="sidebar__container">
      <div>{renderBackground}</div>
    </div>
  )
}

export default BackgroundSideBar
