import "./App.css";
import Footer from "./app/footer/footer";
import SideNav from "./app/side-nav/sideNav";
import Main from "./app/Main.js";

function App() {
  return (
    <>
      <SideNav />
        <header>
          <MenuButton />
        </header>
        <div className="main" id="main">
          <Main />
        </div>
        <footer>
          <Footer />
        </footer>
    </>
  );
}

function MenuButton() {
  return (
    <div>
      <div className={'banner'} onClick={openNav}>
        <div className={'menu-button col-4'}>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <p className={'col-32'}>REPS</p>
        <p className={'col-32'}>CONVERSATIONS</p>
        <p className={'col-32'}>TECH</p>
      </div>
    </div>
  );
}

/* Set the width of the side navigation to 250px */
function openNav() {
  console.log("opened");
  if (document.getElementById("mySidenav") && document.getElementById("main"))
    document.getElementById("mySidenav").style.width = "200px";
}

export default App;
