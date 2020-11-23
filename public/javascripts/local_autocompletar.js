// This sample uses the Autocomplete widget to help the user select a
// place, then it retrieves the address components associated with that
// place, and then it populates the form fields with those details.
// This sample requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script
// src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">
let placeSearch;
let autocomplete;
//componentes da 'Local API' do Google
const localComponentsAPI = {
  route: "long_name",
  street_number: "short_name",
  sublocality_level_1: "short_name",
  administrative_area_level_2: "long_name",
  administrative_area_level_1: "short_name",
  postal_code: "short_name",
};

function initAutocomplete() {
  // Create the autocomplete object, restricting the search predictions to
  // geographical location types.
  autocomplete = new google.maps.places.Autocomplete(
    document.getElementById("autocomplete"),
    { types: ["geocode"] }
  );
  // Avoid paying for data that you don't need by restricting the set of
  // place fields that are returned to just the address components.
  autocomplete.setFields(["address_component"]);
  // When the user selects an address from the drop-down, populate the
  // address fields in the form.
  autocomplete.addListener("place_changed", showAddressForm);
}

//preenche o formulario com os dados de endereço
function fillInAddress(address) {
  //limpa o formulario
  elFormAddrInputs.each((index, element) => {
    element.value = '';
  });

  //se recebeu endereço como parametro, preenche com os dados recebidos
  if(address) {
    elFormAddrInputs.each((index, element) => {
      if(address[element.id]){
        element.value = address[element.id];
      }
    });
  }
  else { //se não, preenche com os dados da 'Local API'
    // Get the place details from the autocomplete object.
    const place = autocomplete.getPlace();
  
    // Get each component of the address from the place details,
    // and then fill-in the corresponding field on the form.
    for (const component of place.address_components) {
      const addressType = component.types[0];
      if (localComponentsAPI[addressType]) {
        const val = component[localComponentsAPI[addressType]];
        document.getElementById(addressType).value = val;
      }
    }
  }
}

// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const geolocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      const circle = new google.maps.Circle({
        center: geolocation,
        radius: position.coords.accuracy,
      });
      autocomplete.setBounds(circle.getBounds());
    });
  }
}


//************ MINHAS FUNCOES *****************
let lastCreatedAddressId = 0;
let addressList = [];
let addressLocalStorageKey = 'addressLocalStorage';
let elAddressSelected = $('#address-selected');
let elLocationField = $('#locationField');
let elAddressList = $('#address-list');
let elFormAddress = $('#address-form');
let elFormAddrInputs = $("#address-form input");
let elConfirmButton = $('#address-form .confirmarBtn');

//componentes para seleção de endereço ficam visíveis
function showAddressList(){
  $('#locationField > input').val(""); //limpa pesquisa
  elAddressList.slideDown();
  elLocationField.slideDown();
  elFormAddress.slideUp();
}
//form para prenchimente de endereço fica visível
function showAddressForm(addr_id){
  if(addr_id) {
    elConfirmButton.text('ATUALIZAR ENDEREÇO');
    elConfirmButton.click(()=>( editAddress(addr_id)));
    let address = addressList.find((item) => item.id == addr_id);
    fillInAddress(address);
  }
  else {
    elConfirmButton.text('ADICIONAR ENDEREÇO');
    elConfirmButton.click(addAddress);
    fillInAddress();
  }

  elAddressList.slideUp();
  elLocationField.slideUp();
  elFormAddress.slideDown(); 
}

//leitura dos valores do form
function readAddressFromForm() {

  let address = {
    id:null,
    select: false,
    route: $('#route').val(),
    street_number: $('#street_number').val(),
    complement: $('#complement').val(),
    sublocality_level_1: $('#sublocality_level_1').val(),
    administrative_area_level_2: $('#administrative_area_level_2').val(),
    administrative_area_level_1: $('#administrative_area_level_1').val(),
    postal_code: $('#postal_code').val(),
  }
  return address;
}

function createAddressBoxHtml(addr){
  let addressLine1 = `${addr.route}, ${addr.street_number}`;
  if(addr.complement) {
    addressLine1 += `, ${addr.complement}`;
  }

  let addressLine2 = `${addr.sublocality_level_1}, ${addr.administrative_area_level_2}/${addr.administrative_area_level_1}, ${addr.postal_code}`;

  let addressClass;
  if(addr.select == true) {
    addressClass = "address-box address-box-select";
  }else{
    addressClass = "address-box";
  }


  let addressBoxHTML = `
    <div class="${addressClass}" id="address-box-${addr.id}" onclick="selectAddress(${addr.id}, 'address-box-${addr.id}')">
      <!--<input type="radio" name="addr-select">-->
      <div>
        <div class="icon-select">SELECIONADO PARA ENTREGA</div>
        <div class="address-text">
          <div class="address-line address-line-1">${addressLine1}</div>
          <div class="address-line address-line-2">${addressLine2}</div>
          </div>
      </div>
      <div class="address-box-controls">
        <button id="address-editar" onclick="showAddressForm(${addr.id})">Editar</button>
        <button id="address-remover" onclick="removeAddress(${addr.id}, 'address-box-${addr.id}')">Apagar</button>
      </div>
    </div>`;

  return addressBoxHTML;
}

function addAddress(){
  lastCreatedAddressId++;
  localStorage.setItem('lastCreatedAddressId', lastCreatedAddressId);

  let address = readAddressFromForm();
  address.id = lastCreatedAddressId;
  address.select = true;
  let addressBoxHTML = createAddressBoxHtml(address);

  addressList.push(address);
  localStorage.setItem(addressLocalStorageKey, JSON.stringify(addressList));
  elAddressList.append(addressBoxHTML);

  showAddressList();
}

function editAddress(addr_id){
  let addrIndex = addressList.findIndex(item => item.id == addr_id);
  let address = readAddressFromForm();
  address.id = addr_id;
  addressList[addrIndex] = address;
  localStorage.setItem(addressLocalStorageKey, JSON.stringify(addressList));
  
  loadAddressList();
  showAddressList();
}

function selectAddress(addr_id, element_id){
  addressList.forEach(addr => { addr.select = false; });
  $('.address-box').each((idx, element) => {
    $(element).removeClass('address-box-select');
  });
  
  let addrIndex = addressList.findIndex(addr => addr.id == addr_id);
  addressList[addrIndex].select = true;
  localStorage.setItem(addressLocalStorageKey, JSON.stringify(addressList));
  $('#'+element_id).addClass('address-box-select');

}

//inicializa lista de endereços
function loadAddressList() {
    //carrega address list
    let storageAddressList = localStorage.getItem(addressLocalStorageKey);
    if(storageAddressList != null){
      addressList = JSON.parse(storageAddressList);

      //cria html da lista de andereços
      let addressBoxesHTML = "";
      addressList.forEach(address => {
        addressBoxesHTML += createAddressBoxHtml(address);
      });

      //insere html
      elAddressList.html(addressBoxesHTML);

      //marca ultimo endereco selecionado
      addressList.map
    }

    //leitura do ultimo address ID criado
    lastCreatedAddressId = Number(localStorage.getItem('lastCreatedAddressId'));
    if(lastCreatedAddressId == null)
      lastCreatedAddressId = 0;
}

//ao carregar o script, essa função sera executada
loadAddressList();