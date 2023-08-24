"C:\Program Files\ImageMagick-7.0.11-Q16-HDRI\magick.exe" mogrify -format jpg -path tn -thumbnail "255x255>" "%1" "tn\%1"
move "tn\%~n1.jpg" "tn\%~n1_tn.jpg"
