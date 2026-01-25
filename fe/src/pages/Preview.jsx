import Balatro from '../components/Balatro';

const Preview = () => {
    return (
        <div className="w-screen h-screen bg-black flex flex-col items-center justify-center">
            <div className='w-full h-full absolute'>
                <Balatro
                    isRotate={false}
                    mouseInteraction
                    pixelFilter={745}
                    color1="#000000"
                    color2="#006BB4"
                    color3="#162325"
                />      
            </div>
            <div className='w-[90%] h-[90%] p-5 z-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl'>
            </div>
        </div>
    )
}

export default Preview;