from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas
from database import engine, SessionLocal

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[""],
    allow_credentials=True,
    allow_methods=[""],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# SİHİRLİ KURULUM BUTONU
@app.get("/kurulum")
def kurulum_yap(db: Session = Depends(get_db)):
    kullanici = db.query(models.Kullanici).first()

    if not kullanici:
        kullanici = models.Kullanici(isim="Alper", email="alper@test.com")
        db.add(kullanici)
        db.commit()
        db.refresh(kullanici)

    if not db.query(models.Hesap).first():
        hesap = models.Hesap(
            ad="Nakit Cüzdan",
            bakiye=5000.0,
            kullanici_id=kullanici.id
        )
        db.add(hesap)
        db.commit()

    return {
        "mesaj": "Veritabani can suyu verildi! Alper kullanicisi ve Nakit Cuzdan hazir."
    }

@app.get("/")
def ana_sayfa():
    return {"mesaj": "API ve Veritabani kusursuz calisiyor!"}

@app.post("/kullanicilar/", response_model=schemas.KullaniciResponse)
def kullanici_olustur(kullanici: schemas.KullaniciCreate, db: Session = Depends(get_db)):
    yeni_kullanici = models.Kullanici(
        isim=kullanici.isim,
        email=kullanici.email
    )
    db.add(yeni_kullanici)
    db.commit()
    db.refresh(yeni_kullanici)
    return yeni_kullanici

@app.get("/kullanicilar/", response_model=list[schemas.KullaniciResponse])
def kullanicilari_getir(db: Session = Depends(get_db)):
    return db.query(models.Kullanici).all()

@app.post("/hesaplar/", response_model=schemas.HesapResponse)
def hesap_olustur(hesap: schemas.HesapCreate, db: Session = Depends(get_db)):
    yeni_hesap = models.Hesap(
        ad=hesap.ad,
        bakiye=hesap.bakiye,
        kullanici_id=hesap.kullanici_id
    )
    db.add(yeni_hesap)
    db.commit()
    db.refresh(yeni_hesap)
    return yeni_hesap

@app.get("/hesaplar/", response_model=list[schemas.HesapResponse])
def hesaplari_getir(db: Session = Depends(get_db)):
    return db.query(models.Hesap).all()

@app.post("/kategoriler/", response_model=schemas.KategoriResponse)
def kategori_olustur(kategori: schemas.KategoriCreate, db: Session = Depends(get_db)):
    yeni_kategori = models.Kategori(ad=kategori.ad)
    db.add(yeni_kategori)
    db.commit()
    db.refresh(yeni_kategori)
    return yeni_kategori

@app.get("/kategoriler/", response_model=list[schemas.KategoriResponse])
def kategorileri_getir(db: Session = Depends(get_db)):
    return db.query(models.Kategori).all()

@app.post("/islemler/", response_model=schemas.IslemResponse)
def islem_olustur(islem: schemas.IslemCreate, db: Session = Depends(get_db)):

    # KATEGORİ ZEKASI: Kullanıcının yazdığı kategori veritabanında var mı?
    kategori = db.query(models.Kategori).filter(
        models.Kategori.ad == islem.kategori_adi
    ).first()

    # Yoksa, anında yeni kategori olarak veritabanına kaydet!
    if not kategori:
        kategori = models.Kategori(ad=islem.kategori_adi)
        db.add(kategori)
        db.commit()
        db.refresh(kategori)

    # İşlemi kaydet
    yeni_islem = models.Islem(
        tutar=islem.tutar,
        aciklama=islem.aciklama,
        hesap_id=islem.hesap_id,
        kategori_id=kategori.id
    )
    db.add(yeni_islem)

    # Bakiyeden düş/ekle
    hesap = db.query(models.Hesap).filter(
        models.Hesap.id == islem.hesap_id
    ).first()

    if hesap:
        hesap.bakiye += islem.tutar

    db.commit()
    db.refresh(yeni_islem)
    return yeni_islem

@app.get("/islemler/", response_model=list[schemas.IslemResponse])
def islemleri_getir(db: Session = Depends(get_db)):
    return db.query(models.Islem).all()