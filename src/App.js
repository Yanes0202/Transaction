import { useEffect, useState } from 'react';
import './App.css';
import db from './firebase';
import { doc, runTransaction } from "firebase/firestore";
import {onSnapshot} from "firebase/firestore";

function App() {

  const [ equipmentGold, setEquipmentGold ] = useState(0);
  const [ equipmentItems, setEquipmentItems ] = useState([]);
  const [ shopGold, setShopGold ] = useState(0);
  const [ shopItems, setShopItems ] = useState([]);
  const shopDB = doc(db,"shop","shop");
  const eqDB = doc(db,"equipment","equipment");

  // DB connection for Shop items
  const shopConnect = ()=> {
    onSnapshot(shopDB,(snapshot)=>{
      var obj = snapshot.data().items;
      setShopGold(snapshot.data().gold);
      setShopItems(Object.keys(obj).map((key) => ({name: key, prop: obj[key]})));
    });
  }

  // DB connection for Equipment items
  const equipmentConnect = ()=> {
    onSnapshot(eqDB,(snapshot)=>{
      var obj = snapshot.data().items;
      setEquipmentGold(snapshot.data().gold);
      setEquipmentItems(Object.keys(obj).map((key) => ({name: key, prop: obj[key]})));
    });
  }

  // Filter and sort if quantity < 1
  const shopItemsFilter = () => {
    return shopItems.filter((item) => item.prop.quantity >= 1).sort((a,b) => {
      if(a.name < b.name) { return -1; }
      if(a.name > b.name) { return 1; }
      return 0;})
  }

  // Filter if quantity < 1
  const eqItemsFilter = () => {
    return equipmentItems.filter((item) => item.prop.quantity >= 1).sort((a,b) => {
      if(a.name < b.name) { return -1; }
      if(a.name > b.name) { return 1; }
      return 0;})
  }

  // BUY TRANSACTION
  const buyItem = async (itemName) => {
    try {
      await runTransaction(db,async(transaction) =>{

        // GET DB DATA
        const shopData = await transaction.get(shopDB);
        const eqData = await transaction.get(eqDB);

        // Checking if DB documents exist
        if(!eqData.exists()){
          throw Error("Equipment data does not exist!");
        }
        if(!shopData.exists()){
          throw Error("Shop data does not exist!");
        }

        const quantity = 1;
        
        //eq variables
        var eqGold = eqData.data().gold;
        var eqItems = eqData.data().items;
        var eqFinalItems = Object.fromEntries(Object.entries(eqItems).filter(key=>!key.includes(itemName)));


        //shop variables
        var shopGold = shopData.data().gold;
        var shopItems = shopData.data().items;
        var shopItemPrice = shopItems[itemName].price;
        var shopItemQuantity = shopItems[itemName].quantity;
        var shopFinalItems = Object.fromEntries(Object.entries(shopItems).filter(key=>!key.includes(itemName)));
        
          // Checking and decreasing Equipment Gold
          if(eqGold >= shopItemPrice){
            var newEqGold = eqGold - shopItemPrice;
            var newShopGold = shopGold + shopItemPrice;
            var newShopItemQuantity = shopItemQuantity - quantity;

            var newEqItemPrice = shopItemPrice;
            var eqQuantity = 0;

            // DATA FOR SHOP UPDATING
            if(newShopItemQuantity!==0){
              shopFinalItems[itemName] = {
                "price": shopItemPrice,
                "quantity": newShopItemQuantity
              }
            }

            var items = shopFinalItems;
            var updatedShopData = {
              "gold": newShopGold,
              items
            }

          
            // IF ITEM EXIST IN DB
            if(itemName in eqItems){
              eqQuantity = eqItems[itemName].quantity;
            }

              var newEqItemQuantity = eqQuantity + quantity;
              
                eqFinalItems[itemName] = {
                  "price": newEqItemPrice,
                  "quantity": newEqItemQuantity
                }
              
              var items = eqFinalItems;

              var updatedEqData = {
                "gold": newEqGold,
                items
              }


              // UPDATING SHOP DB
              transaction.update(shopDB,updatedShopData);

              // updating EQ DB
              transaction.update(eqDB,updatedEqData);
        
          }else{
            alert("Not Enough gold!");
            throw Error("Not Enough gold!");
          }
        
      })
    }catch(e){
      console.log("Transaction failed: "+e)
    }
  }

  // SELL TRANSACTION
  const sellItem = async (itemName) => {
    try{
      await runTransaction(db,async(transaction) =>{
        const shopData = await transaction.get(shopDB);
        const eqData = await transaction.get(eqDB)

        // Checking if DB documents exist
        if(!eqData.exists()){
          throw Error("Equipment data does not exist!");
        }
        if(!shopData.exists()){
          throw Error("Shop data does not exist!");
        }

        const quantity = 1;
        
        //eq variables
        var eqGold = eqData.data().gold;
        var eqItems = eqData.data().items;
        var eqItemPrice = eqItems[itemName].price;
        var eqFinalItems = Object.fromEntries(Object.entries(eqItems).filter(key=>!key.includes(itemName)));

        
        //shop variables
        var shopGold = shopData.data().gold;
        var shopItems = shopData.data().items;
        var shopFinalItems = Object.fromEntries(Object.entries(shopItems).filter(key=>!key.includes(itemName)));
        
        var shopQuantity = 0;
        
        // Checking IF ENOUGH GOLD
        if(shopGold >= eqItemPrice){

          // CALCULATIONS FOR EQUIPMENT
          var newEqGold = eqGold + eqItemPrice;
          var newEqItemQuantity = eqItems[itemName].quantity - quantity;
          var newEqItemPrice = eqItemPrice;

          // IF QUANTITY 0 DELETE
          if(newEqItemQuantity!==0){
            eqFinalItems[itemName] = {
              "price": newEqItemPrice,
              "quantity": newEqItemQuantity
            }
          }

          var items = eqFinalItems;

          // DATA FOR EQ UPDATING
          var updatedEqData = {
            "gold": newEqGold,
            items
          }
            
          // IF ITEM EXIST IN SHOP ADD QUANTITY TO IT
          if(itemName in shopItems){
            shopQuantity = shopItems[itemName].quantity;
          }

          // CALCULATION FOR SHOP
          var newShopGold = shopGold - eqItemPrice;
          var newShopItemQuantity = shopQuantity + quantity;

          shopFinalItems[itemName] = {
            "price": newEqItemPrice,
            "quantity": newShopItemQuantity
          }

          var items = shopFinalItems;

          // DATA FOR SHOP UPDATING
          var updatedShopData = {
            "gold": newShopGold,
            items
          }

          // UPDATING EQ DB
          transaction.update(eqDB,updatedEqData);

          // UPDATING SHOP DB
          transaction.update(shopDB,updatedShopData);
            
          }else{

            alert("Not Enough gold!");
            throw Error("Not Enough gold!");

          }

      });
    }catch(e){
      console.log("Transaction failed: "+e)
    }
  }

  // REALTIME CONNECTION TO EQ AND SHOP DB
  useEffect(()=>{

    shopConnect();
    equipmentConnect();

  },[]);

  return (
    <div className="app">
      <div className="shop">
        <h1>Sklep:</h1>
        <div className="gold">
          <h2>Ilość złota w sklepie: {shopGold}</h2>
          <div className="coin"></div>
        </div>
        {shopItemsFilter().map((item)=>(
          <div className="shopDiv" key={item.name}> 
            <div className="shopItems" >
              <h3>{item.name}</h3>
              <p>Ilość: {item.prop.quantity}</p>
              <p>Cena: {item.prop.price}</p>
            </div>
            <div className="buyButton" onClick={()=>buyItem(item.name)}>
              Kup
            </div>
          </div>
        ))}
      </div>
      <div className="equipment">
          <h1>Ekwipunek:</h1>
          <div className="gold">
            <h2>Ilość złota w ekwipunku: {equipmentGold}</h2>
            <div className="coin"></div>
          </div>
          {eqItemsFilter().map((item)=>(
            <div className='eq' key={item.name}>
              <div className='sellButton' onClick={()=>sellItem(item.name)}>
              Sprzedaj
              </div>
              <div className="eqItems" >
                <h3>{item.name}</h3>
                <p>Ilość: {item.prop.quantity}</p>
                <p>Wartość: {item.prop.price}</p>
              </div>
            </div>
            
          ))}

      </div>
    </div>
  );
}

export default App;
