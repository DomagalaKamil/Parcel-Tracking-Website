const parcelOptions = {
  XS:  { max_kg: 25, dim: "25x10x8",  price: 6.99 },
  S:   { max_kg: 25, dim: "64x38x8",  price: 7.99 },
  M:   { max_kg: 25, dim: "64x38x15", price: 10.99 },
  L:   { max_kg: 25, dim: "64x38x41", price: 12.99 },
  XL:  { max_kg: 30, dim: "80x60x40", price: 15.99 },
  XXL: { max_kg: 50, dim: "100x80x60", price: 19.99 }
};

function selectParcel(t){
  const p = parcelOptions[t];

  localStorage.setItem("parcel_type", t);
  localStorage.setItem("parcel_max_kg", p.max_kg);
  localStorage.setItem("parcel_max_dim", p.dim);
  localStorage.setItem("parcel_price", p.price);

  window.location.href = "parcel_form.html";
}