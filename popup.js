document.addEventListener("DOMContentLoaded", async function () {
	const dropZone = document.getElementById('drop_zone');

	dropZone.addEventListener('dragover', function (e) {
		e.preventDefault();
		e.target.style.border = '2px dashed #000';
	});

	dropZone.addEventListener('drop', async function (e) {
		e.preventDefault();
		e.target.style.border = 'none';

		let files = Array.from(e.dataTransfer.files);

		// Sort the files in alphanumeric order based on their names
		files.sort((a, b) => a.name.localeCompare(b.name));

		const pdfDoc = await window['PDFLib'].PDFDocument.create();

		for (const file of files) {
			await new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = async function (event) {
					const arrayBuffer = event.target.result;
					const img = new Image();
					img.src = URL.createObjectURL(new Blob([arrayBuffer]));

					img.onload = async function () {
						const width = img.width;
						const height = img.height;

						const page = pdfDoc.addPage([width, height]);

						const imgUint8Array = new Uint8Array(arrayBuffer);
						const pdfImage = await pdfDoc.embedJpg(imgUint8Array);

						page.drawImage(pdfImage, {
							x: 0,
							y: 0,
							width,
							height,
						});

						resolve();
					};
				};
				reader.onerror = reject;
				reader.readAsArrayBuffer(file);
			});
		}

		const pdfBytes = await pdfDoc.save();
		const blob = new Blob([pdfBytes], {type: 'application/pdf'});
		const url = URL.createObjectURL(blob);

		chrome.downloads.download({
			url: url,
			filename: 'combined.pdf'
		});
	});
});
