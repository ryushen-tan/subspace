import { Link } from "react-router-dom";

const Landing = () => {
    return (
        <div className="landing-container">
            <h1>Welcome to the Landing Page</h1>
            <p>This is where users will first arrive.</p>
            <Link to="/edit">Editor</Link>
        </div>
    );
}
export default Landing;