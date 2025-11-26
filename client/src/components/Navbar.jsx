import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ padding: "10px", background: "#efefef" }}>
      <Link to="/home">Home</Link> |{" "}
      <Link to="/workouts">Workouts</Link> |{" "}
      <Link to="/mealplan">MealPlan</Link> |{" "}
      <Link to="/calculator">Calculator</Link> |{" "}
      <Link to="/about">About</Link> |{" "}
      <Link to="/contact">Contact</Link> 
    </nav>
  );
}